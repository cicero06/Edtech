import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { isDeepStrictEqual } from 'node:util';
import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { C } from '../firebase/collections.js';
import {
  chunk,
  decodeJson,
  encodeJson,
  FirebaseService,
  fromDoc,
} from '../firebase/firebase.service.js';
import {
  nameKey,
  type ActivitySession,
  type GameAttempt,
  type LearningEvent,
  type Participant,
  type ScenarioVersion,
} from '../firebase/models.js';
import { AccessService } from './auth/access.service.js';
import { AtlasAuthService } from './auth/atlas-auth.service.js';
import type { AuthPrincipal } from './auth/principal.js';
import type { JoinActivityDto, SyncAttemptDto } from './dto/sync.dto.js';
import {
  PAYLOAD_SCHEMA_VERSION,
  validateEventPayload,
  type ScenarioManifest,
} from './events/event-catalog.js';
import { ManagementService } from './management.service.js';
import { attemptView } from './views.js';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly access: AccessService,
    private readonly auth: AtlasAuthService,
    private readonly management: ManagementService,
  ) {}

  private get db() {
    return this.firebase.db;
  }

  /**
   * Facilitator-approved entry (design doc §8.2): the participant must already
   * exist in the group roster; a token scoped to that participant is issued.
   */
  async join(dto: JoinActivityDto) {
    const code = dto.joinCode.trim().toUpperCase();
    const codeSnap = await this.db.collection(C.joinCodes).doc(code).get();
    const groupId = codeSnap.data()?.groupId as string | undefined;
    if (!groupId) throw new ForbiddenException('Invalid join code');

    const [activitySnap, participantSnap] = await Promise.all([
      this.db
        .collection(C.activities)
        .where('groupId', '==', groupId)
        .where('status', '==', 'OPEN')
        .orderBy('openedAt', 'desc')
        .limit(1)
        .get(),
      this.db
        .collection(C.participants)
        .where('groupId', '==', groupId)
        .where('displayNameKey', '==', nameKey(dto.displayName))
        .limit(1)
        .get(),
    ]);
    if (activitySnap.empty) throw new ForbiddenException('No open activity');
    const activity = fromDoc<ActivitySession>(activitySnap.docs[0])!;
    if (participantSnap.empty) {
      throw new ForbiddenException('Name is not on the roster');
    }
    const participant = fromDoc<Participant>(participantSnap.docs[0])!;

    const activeSnap = await this.db
      .collection(C.attempts)
      .where('participantId', '==', participant.id)
      .where('activityId', '==', activity.id)
      .where('status', '==', 'ACTIVE')
      .limit(1)
      .get();
    let attempt = activeSnap.empty
      ? null
      : fromDoc<GameAttempt>(activeSnap.docs[0]);
    if (attempt && dto.restart) {
      await this.db
        .collection(C.attempts)
        .doc(attempt.id)
        .update({ status: 'ABANDONED' });
      attempt = null;
    }
    if (!attempt) {
      const id = randomUUID();
      attempt = {
        id,
        participantId: participant.id,
        activityId: activity.id,
        groupId,
        workspaceId: activity.workspaceId,
        scenarioVersionId: activity.scenarioVersionId,
        clientAttemptId: dto.clientAttemptId ?? randomUUID(),
        status: 'ACTIVE',
        revision: 0,
        eventCount: 0,
        startedAt: new Date(),
        completedAt: null,
        state: null,
        stateUpdatedAt: null,
      };
      const { id: _id, ...data } = attempt;
      await this.db.collection(C.attempts).doc(id).create(data);
    }

    const token = await this.auth.issueParticipantToken(participant.id);
    return { token, attempt: attemptView(attempt) };
  }

  async getAttempt(principal: AuthPrincipal, attemptId: string) {
    const attempt = await this.access.attempt(attemptId);
    await this.assertReadAccess(principal, attempt);
    return attemptView(attempt);
  }

  async listEvents(principal: AuthPrincipal, attemptId: string) {
    const attempt = await this.access.attempt(attemptId);
    if (principal.kind !== 'adult') {
      throw new ForbiddenException('Raw events require staff access');
    }
    await this.access.requireMembership(principal.user.id, attempt.workspaceId);
    const snap = await this.db
      .collection(C.attempts)
      .doc(attemptId)
      .collection(C.events)
      .orderBy('sequence', 'asc')
      .get();
    return snap.docs.map((d) => {
      const e = fromDoc<LearningEvent>(d)!;
      return { ...e, payload: decodeJson(e.payload) };
    });
  }

  /**
   * Idempotent event+state sync. A batch is all-or-nothing; retries resend the
   * same clientEventIds and are deduplicated. A divergent payload under a seen
   * clientEventId — or a reused sequence — is a 409 conflict.
   *
   * Only the batch's own ids/sequences are read (not the whole event log), so
   * Firestore read cost stays proportional to the batch size.
   */
  async sync(principal: AuthPrincipal, attemptId: string, dto: SyncAttemptDto) {
    if (principal.kind !== 'participant') {
      throw new ForbiddenException('Only the owning participant can sync');
    }
    const events = dto.events ?? [];
    if (dto.state !== undefined && dto.baseRevision === undefined) {
      throw new BadRequestException('baseRevision is required with state');
    }

    // Batch-internal checks need no I/O.
    const batchIds = new Set<string>();
    const batchSequences = new Set<number>();
    for (const event of events) {
      if (batchIds.has(event.clientEventId) || batchSequences.has(event.sequence)) {
        throw new ConflictException('Duplicate id or sequence in batch');
      }
      batchIds.add(event.clientEventId);
      batchSequences.add(event.sequence);
    }

    const attemptRef = this.db.collection(C.attempts).doc(attemptId);
    const eventsCol = attemptRef.collection(C.events);

    return this.db.runTransaction(async (tx) => {
      const attempt = fromDoc<GameAttempt>(await tx.get(attemptRef));
      if (!attempt || attempt.participantId !== principal.participant.id) {
        throw new ForbiddenException('Attempt not found for this participant');
      }
      if (attempt.status !== 'ACTIVE') {
        throw new ConflictException('Attempt is not active');
      }
      const sv = fromDoc<ScenarioVersion>(
        await tx.get(
          this.db.collection(C.scenarioVersions).doc(attempt.scenarioVersionId),
        ),
      );
      const manifest = (decodeJson(sv?.manifest) ?? {}) as ScenarioManifest;

      const seenById = new Map<string, { sequence: number; payload: unknown }>();
      const seenSequences = new Map<number, string>();
      if (events.length) {
        const byId = await tx.getAll(
          ...events.map((e) => eventsCol.doc(e.clientEventId)),
        );
        for (const snap of byId) {
          if (!snap.exists) continue;
          const data = snap.data()!;
          seenById.set(snap.id, {
            sequence: data.sequence as number,
            payload: decodeJson(data.payload),
          });
        }
        for (const seqs of chunk([...batchSequences])) {
          const bySeq = await tx.get(eventsCol.where('sequence', 'in', seqs));
          for (const d of bySeq.docs) {
            seenSequences.set(d.data().sequence as number, d.id);
          }
        }
      }

      const fresh = events.filter((event) => {
        const existing = seenById.get(event.clientEventId);
        if (existing) {
          if (
            existing.sequence !== event.sequence ||
            !isDeepStrictEqual(existing.payload, event.payload)
          ) {
            throw new ConflictException('clientEventId payload conflict');
          }
          return false;
        }
        if (seenSequences.has(event.sequence)) {
          throw new ConflictException('sequence already used');
        }
        return true;
      });

      for (const event of fresh) {
        if (event.payloadSchemaVersion !== PAYLOAD_SCHEMA_VERSION) {
          throw new BadRequestException('Unsupported payloadSchemaVersion');
        }
        const reason = validateEventPayload(event.type, event.payload, manifest);
        if (reason) {
          throw new BadRequestException(`${event.type}: ${reason}`);
        }
      }

      let revision = attempt.revision;
      if (dto.state !== undefined && dto.baseRevision !== attempt.revision) {
        throw new ConflictException('Stale baseRevision');
      }

      // ---- writes ----
      const receivedAt = new Date();
      for (const event of fresh) {
        tx.create(eventsCol.doc(event.clientEventId), {
          attemptId,
          clientEventId: event.clientEventId,
          sequence: event.sequence,
          type: event.type,
          payloadSchemaVersion: event.payloadSchemaVersion,
          payload: encodeJson(event.payload),
          occurredAt: new Date(event.occurredAt),
          receivedAt,
        });
      }

      const update: Record<string, unknown> = {};
      if (fresh.length) update.eventCount = FieldValue.increment(fresh.length);
      if (dto.state !== undefined) {
        revision += 1;
        update.revision = revision;
        update.state = encodeJson(dto.state);
        update.stateUpdatedAt = receivedAt;
      }
      if (fresh.some((event) => event.type === 'attempt_completed')) {
        update.status = 'COMPLETED';
        update.completedAt = receivedAt;
      }
      if (Object.keys(update).length) tx.update(attemptRef, update);

      return {
        accepted: fresh.length,
        skipped: events.length - fresh.length,
        revision,
      };
    });
  }

  async getPublicReport(shareCode: string) {
    const raw = shareCode
      .trim()
      .toUpperCase()
      .replace(/^DNGA-?/, '')
      .replace(/[^0-9A-F]/g, '');
    if (raw.length < 4) {
      throw new BadRequestException('Geçersiz rapor kodu');
    }
    const prefix = `DNGA-${raw.slice(0, 6)}`;
    const snap = await this.db
      .collection(C.participants)
      .where('shareCode', '>=', prefix)
      .where('shareCode', '<=', `${prefix}`)
      .limit(1)
      .get();
    if (snap.empty) {
      throw new ForbiddenException('Bu koda ait öğrenci raporu bulunamadı');
    }
    return this.management.reportFor(fromDoc<Participant>(snap.docs[0])!);
  }

  private async assertReadAccess(
    principal: AuthPrincipal,
    attempt: GameAttempt,
  ) {
    if (principal.kind === 'participant') {
      if (attempt.participantId !== principal.participant.id) {
        throw new ForbiddenException('Attempt belongs to another participant');
      }
      return;
    }
    await this.access.requireMembership(principal.user.id, attempt.workspaceId);
  }
}
