import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { isDeepStrictEqual } from 'node:util';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AccessService } from './auth/access.service.js';
import { AtlasAuthService } from './auth/atlas-auth.service.js';
import type { AuthPrincipal } from './auth/principal.js';
import type { JoinActivityDto, SyncAttemptDto } from './dto/sync.dto.js';
import {
  PAYLOAD_SCHEMA_VERSION,
  validateEventPayload,
  type ScenarioManifest,
} from './events/event-catalog.js';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly auth: AtlasAuthService,
  ) {}

  /**
   * Facilitator-approved entry (design doc §8.2): the participant must already
   * exist in the group roster; a token scoped to that participant is issued.
   */
  async join(dto: JoinActivityDto) {
    const group = await this.prisma.group.findUnique({
      where: { joinCode: dto.joinCode.trim().toUpperCase() },
    });
    if (!group) throw new ForbiddenException('Invalid join code');
    const activity = await this.prisma.activitySession.findFirst({
      where: { groupId: group.id, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });
    if (!activity) throw new ForbiddenException('No open activity');
    const participant = await this.prisma.participant.findFirst({
      where: {
        groupId: group.id,
        displayName: { equals: dto.displayName.trim(), mode: 'insensitive' },
      },
    });
    if (!participant) throw new ForbiddenException('Name is not on the roster');

    let attempt = await this.prisma.gameAttempt.findFirst({
      where: {
        participantId: participant.id,
        activityId: activity.id,
        status: 'ACTIVE',
      },
      include: { state: true },
    });
    if (attempt && dto.restart) {
      attempt = await this.prisma.gameAttempt.update({
        where: { id: attempt.id },
        data: { status: 'ABANDONED' },
        include: { state: true },
      });
      attempt = null;
    }
    attempt ??= await this.prisma.gameAttempt.create({
      data: {
        participantId: participant.id,
        activityId: activity.id,
        scenarioVersionId: activity.scenarioVersionId,
        clientAttemptId: dto.clientAttemptId ?? randomUUID(),
      },
      include: { state: true },
    });

    const token = await this.auth.issueParticipantToken(participant.id);
    return { token, attempt };
  }

  async getAttempt(principal: AuthPrincipal, attemptId: string) {
    const attempt = await this.access.attemptWithScope(attemptId);
    await this.assertReadAccess(principal, attempt);
    return attempt;
  }

  async listEvents(principal: AuthPrincipal, attemptId: string) {
    const attempt = await this.access.attemptWithScope(attemptId);
    if (principal.kind !== 'adult') {
      throw new ForbiddenException('Raw events require staff access');
    }
    await this.access.requireMembership(
      principal.user.id,
      attempt.activity.group.workspaceId,
    );
    return this.prisma.learningEvent.findMany({
      where: { attemptId },
      orderBy: [{ sequence: 'asc' }, { receivedAt: 'asc' }],
    });
  }

  /**
   * Idempotent event+state sync. A batch is all-or-nothing; retries resend the
   * same clientEventIds and are deduplicated. A divergent payload under a seen
   * clientEventId — or a reused sequence — is a 409 conflict.
   */
  async sync(principal: AuthPrincipal, attemptId: string, dto: SyncAttemptDto) {
    if (principal.kind !== 'participant') {
      throw new ForbiddenException('Only the owning participant can sync');
    }
    const events = dto.events ?? [];
    if (dto.state !== undefined && dto.baseRevision === undefined) {
      throw new BadRequestException('baseRevision is required with state');
    }
    return this.prisma.$transaction(async (tx) => {
      const attempt = await tx.gameAttempt.findUnique({
        where: { id: attemptId },
        include: {
          scenarioVersion: true,
          events: { select: { clientEventId: true, sequence: true, payload: true } },
        },
      });
      if (!attempt || attempt.participantId !== principal.participant.id) {
        throw new ForbiddenException('Attempt not found for this participant');
      }
      if (attempt.status !== 'ACTIVE') {
        throw new ConflictException('Attempt is not active');
      }
      const manifest = (attempt.scenarioVersion.manifest ??
        {}) as ScenarioManifest;

      const seenIds = new Map(attempt.events.map((e) => [e.clientEventId, e]));
      const seenSequences = new Map(
        attempt.events.map((e) => [e.sequence, e.clientEventId]),
      );
      const batchIds = new Set<string>();
      const batchSequences = new Set<number>();
      const fresh = events.filter((event) => {
        if (batchIds.has(event.clientEventId) || batchSequences.has(event.sequence)) {
          throw new ConflictException('Duplicate id or sequence in batch');
        }
        batchIds.add(event.clientEventId);
        batchSequences.add(event.sequence);
        const existing = seenIds.get(event.clientEventId);
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

      if (fresh.length) {
        await tx.learningEvent.createMany({
          data: fresh.map((event) => ({
            attemptId: attempt.id,
            clientEventId: event.clientEventId,
            sequence: event.sequence,
            type: event.type,
            payloadSchemaVersion: event.payloadSchemaVersion,
            payload: event.payload as Prisma.InputJsonValue,
            occurredAt: new Date(event.occurredAt),
          })),
        });
      }

      let revision = attempt.revision;
      if (dto.state !== undefined) {
        if (dto.baseRevision !== attempt.revision) {
          throw new ConflictException('Stale baseRevision');
        }
        await tx.attemptState.upsert({
          where: { attemptId: attempt.id },
          create: {
            attemptId: attempt.id,
            state: dto.state as Prisma.InputJsonValue,
          },
          update: { state: dto.state as Prisma.InputJsonValue },
        });
        revision += 1;
      }

      const completed = fresh.some((event) => event.type === 'attempt_completed');
      if (completed || revision !== attempt.revision) {
        await tx.gameAttempt.update({
          where: { id: attempt.id },
          data: {
            revision,
            ...(completed
              ? { status: 'COMPLETED' as const, completedAt: new Date() }
              : {}),
          },
        });
      }

      return {
        accepted: fresh.length,
        skipped: events.length - fresh.length,
        revision,
      };
    });
  }

  private async assertReadAccess(
    principal: AuthPrincipal,
    attempt: { participantId: string; activity: { group: { workspaceId: string } } },
  ) {
    if (principal.kind === 'participant') {
      if (attempt.participantId !== principal.participant.id) {
        throw new ForbiddenException('Attempt belongs to another participant');
      }
      return;
    }
    await this.access.requireMembership(
      principal.user.id,
      attempt.activity.group.workspaceId,
    );
  }
}
