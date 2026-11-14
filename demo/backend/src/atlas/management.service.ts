import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
import type { DocumentReference, Firestore } from 'firebase-admin/firestore';
import { C } from '../firebase/collections.js';
import {
  chunk,
  encodeJson,
  FirebaseService,
  fromDoc,
  decodeJson,
} from '../firebase/firebase.service.js';
import {
  nameKey,
  shareCodeOf,
  type ActivitySession,
  type AdultUser,
  type GameAttempt,
  type Group,
  type Membership,
  type Participant,
  type ScenarioVersion,
  type Workspace,
} from '../firebase/models.js';
import {
  AccessService,
  MANAGER_ROLES,
  membershipId,
} from './auth/access.service.js';
import type {
  CreateActivityDto,
  CreateGroupDto,
  CreateParticipantDto,
  CreateWorkspaceDto,
} from './dto/management.dto.js';
import { attemptView } from './views.js';

const JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateJoinCode(): string {
  return Array.from({ length: 6 }, () =>
    JOIN_CODE_ALPHABET.charAt(randomInt(JOIN_CODE_ALPHABET.length)),
  ).join('');
}

/** Deletes refs in batches of 400 (Firestore batch limit is 500). */
export async function deleteRefs(db: Firestore, refs: DocumentReference[]) {
  for (const part of chunk(refs, 400)) {
    const batch = db.batch();
    for (const ref of part) batch.delete(ref);
    await batch.commit();
  }
}

@Injectable()
export class ManagementService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly access: AccessService,
  ) {}

  private get db() {
    return this.firebase.db;
  }

  async createWorkspace(user: AdultUser, dto: CreateWorkspaceDto) {
    const id = randomUUID();
    const now = new Date();
    const workspace: Workspace = {
      id,
      kind: dto.kind,
      name: dto.name,
      province: dto.province ?? null,
      district: dto.district ?? null,
      mebCode: dto.mebCode ?? null,
      createdAt: now,
    };
    const membership: Membership = {
      id: membershipId(id, user.id),
      workspaceId: id,
      userId: user.id,
      role: 'OWNER',
      status: 'ACTIVE',
      createdAt: now,
    };
    await this.db.runTransaction(async (tx) => {
      if (dto.mebCode) {
        const dup = await tx.get(
          this.db
            .collection(C.workspaces)
            .where('mebCode', '==', dto.mebCode)
            .limit(1),
        );
        if (!dup.empty) {
          throw new ConflictException('Bu MEB kodu zaten kayıtlı');
        }
      }
      const { id: _wid, ...wsData } = workspace;
      const { id: _mid, ...mData } = membership;
      tx.create(this.db.collection(C.workspaces).doc(id), wsData);
      tx.create(this.db.collection(C.memberships).doc(membership.id), mData);
    });
    return workspace;
  }

  async listWorkspaces(user: AdultUser) {
    const memberships = await this.db
      .collection(C.memberships)
      .where('userId', '==', user.id)
      .where('status', '==', 'ACTIVE')
      .orderBy('createdAt', 'asc')
      .get();
    const rows = memberships.docs.map((d) => fromDoc<Membership>(d)!);
    if (!rows.length) return [];
    const workspaces = await this.db.getAll(
      ...rows.map((m) => this.db.collection(C.workspaces).doc(m.workspaceId)),
    );
    const byId = new Map(
      workspaces
        .map((s) => fromDoc<Workspace>(s))
        .filter((w): w is Workspace => !!w)
        .map((w) => [w.id, w]),
    );
    return rows
      .filter((m) => byId.has(m.workspaceId))
      .map((m) => ({ ...m, workspace: byId.get(m.workspaceId)! }));
  }

  async listGroups(user: AdultUser, workspaceId: string) {
    await this.access.requireMembership(user.id, workspaceId);
    const snap = await this.db
      .collection(C.groups)
      .where('workspaceId', '==', workspaceId)
      .orderBy('createdAt', 'asc')
      .get();
    return snap.docs.map((d) => {
      const g = fromDoc<Group>(d)!;
      return { id: g.id, name: g.name, joinCode: g.joinCode };
    });
  }

  async createGroup(user: AdultUser, workspaceId: string, dto: CreateGroupDto) {
    await this.access.requireMembership(user.id, workspaceId, MANAGER_ROLES);
    const id = randomUUID();
    for (let tries = 0; tries < 5; tries++) {
      const joinCode = generateJoinCode();
      const group: Group = {
        id,
        workspaceId,
        name: dto.name,
        joinCode,
        createdAt: new Date(),
      };
      try {
        await this.db.runTransaction(async (tx) => {
          const codeRef = this.db.collection(C.joinCodes).doc(joinCode);
          if ((await tx.get(codeRef)).exists) throw new CodeTaken();
          const { id: _id, ...data } = group;
          tx.create(codeRef, { groupId: id });
          tx.create(this.db.collection(C.groups).doc(id), data);
        });
        return group;
      } catch (err) {
        if (!(err instanceof CodeTaken)) throw err;
      }
    }
    throw new ConflictException('Katılım kodu üretilemedi, tekrar deneyin');
  }

  async getGroup(user: AdultUser, groupId: string) {
    const group = await this.access.workspaceOfGroup(groupId);
    await this.access.requireMembership(user.id, group.workspaceId);

    const [participantsSnap, activitiesSnap] = await Promise.all([
      this.db
        .collection(C.participants)
        .where('groupId', '==', groupId)
        .orderBy('createdAt', 'asc')
        .get(),
      this.db
        .collection(C.activities)
        .where('groupId', '==', groupId)
        .orderBy('createdAt', 'desc')
        .get(),
    ]);
    const participants = participantsSnap.docs.map(
      (d) => fromDoc<Participant>(d)!,
    );
    const latest = await Promise.all(
      participants.map((p) => this.latestAttempt(p.id)),
    );

    return {
      ...group,
      participants: participants.map((p, i) => {
        const a = latest[i];
        return {
          id: p.id,
          groupId: p.groupId,
          displayName: p.displayName,
          studentNo: p.studentNo,
          avatar: p.avatar,
          createdAt: p.createdAt,
          shareCode: p.shareCode,
          latestAttempt: a
            ? (() => {
                const v = attemptView(a);
                return {
                  id: v.id,
                  status: v.status,
                  startedAt: v.startedAt,
                  completedAt: v.completedAt,
                  revision: v.revision,
                  state: v.state,
                  _count: v._count,
                };
              })()
            : null,
        };
      }),
      activities: activitiesSnap.docs.map(
        (d) => fromDoc<ActivitySession>(d)!,
      ),
    };
  }

  private async latestAttempt(participantId: string) {
    const snap = await this.db
      .collection(C.attempts)
      .where('participantId', '==', participantId)
      .orderBy('startedAt', 'desc')
      .limit(1)
      .get();
    return snap.empty ? null : fromDoc<GameAttempt>(snap.docs[0]);
  }

  async addParticipant(
    user: AdultUser,
    groupId: string,
    dto: CreateParticipantDto,
  ) {
    const group = await this.access.workspaceOfGroup(groupId);
    await this.access.requireMembership(
      user.id,
      group.workspaceId,
      MANAGER_ROLES,
    );
    const displayName = dto.displayName.trim();
    const key = nameKey(displayName);
    const id = randomUUID();
    const participant: Participant = {
      id,
      groupId,
      workspaceId: group.workspaceId,
      displayName,
      displayNameKey: key,
      studentNo: null,
      avatar: dto.avatar ?? null,
      shareCode: shareCodeOf(id),
      createdAt: new Date(),
    };
    await this.db.runTransaction(async (tx) => {
      const dup = await tx.get(
        this.db
          .collection(C.participants)
          .where('groupId', '==', groupId)
          .where('displayNameKey', '==', key)
          .limit(1),
      );
      if (!dup.empty) {
        throw new ConflictException(
          'Bu isimde bir katılımcı grupta zaten kayıtlı',
        );
      }
      const { id: _id, ...data } = participant;
      tx.create(this.db.collection(C.participants).doc(id), data);
    });
    const { displayNameKey: _k, workspaceId: _w, ...view } = participant;
    return view;
  }

  /** All docs belonging to the given participants (attempts, events, tokens). */
  private async participantRefs(participantIds: string[]) {
    const refs: DocumentReference[] = [];
    for (const ids of chunk(participantIds)) {
      const [attempts, tokens] = await Promise.all([
        this.db.collection(C.attempts).where('participantId', 'in', ids).get(),
        this.db
          .collection(C.participantTokens)
          .where('participantId', 'in', ids)
          .get(),
      ]);
      for (const a of attempts.docs) {
        const events = await a.ref.collection(C.events).select().get();
        refs.push(...events.docs.map((e) => e.ref), a.ref);
      }
      refs.push(...tokens.docs.map((t) => t.ref));
    }
    refs.push(
      ...participantIds.map((id) => this.db.collection(C.participants).doc(id)),
    );
    return refs;
  }

  async deleteParticipant(
    user: AdultUser,
    groupId: string,
    participantId: string,
  ) {
    const group = await this.access.workspaceOfGroup(groupId);
    await this.access.requireMembership(
      user.id,
      group.workspaceId,
      MANAGER_ROLES,
    );
    const participant = fromDoc<Participant>(
      await this.db.collection(C.participants).doc(participantId).get(),
    );
    if (!participant || participant.groupId !== groupId) {
      throw new NotFoundException('Öğrenci bulunamadı');
    }
    await deleteRefs(this.db, await this.participantRefs([participantId]));
    const { displayNameKey: _k, workspaceId: _w, ...view } = participant;
    return view;
  }

  async deleteGroup(user: AdultUser, workspaceId: string, groupId: string) {
    await this.access.requireMembership(user.id, workspaceId, MANAGER_ROLES);
    const group = fromDoc<Group>(
      await this.db.collection(C.groups).doc(groupId).get(),
    );
    if (!group || group.workspaceId !== workspaceId) {
      throw new NotFoundException('Grup bulunamadı');
    }
    const [participants, activities, groupAttempts] = await Promise.all([
      this.db.collection(C.participants).where('groupId', '==', groupId).select().get(),
      this.db.collection(C.activities).where('groupId', '==', groupId).select().get(),
      this.db.collection(C.attempts).where('groupId', '==', groupId).select().get(),
    ]);
    const refs = await this.participantRefs(participants.docs.map((d) => d.id));
    const seen = new Set(refs.map((r) => r.path));
    // Attempts of this group's activities by participants elsewhere (defensive).
    for (const a of groupAttempts.docs) {
      if (seen.has(a.ref.path)) continue;
      const events = await a.ref.collection(C.events).select().get();
      refs.push(...events.docs.map((e) => e.ref), a.ref);
    }
    refs.push(
      ...activities.docs.map((d) => d.ref),
      this.db.collection(C.joinCodes).doc(group.joinCode),
      this.db.collection(C.groups).doc(groupId),
    );
    await deleteRefs(this.db, refs);
    return group;
  }

  async getParticipantReport(user: AdultUser, participantId: string) {
    const participant = fromDoc<Participant>(
      await this.db.collection(C.participants).doc(participantId).get(),
    );
    if (!participant) throw new NotFoundException('Öğrenci bulunamadı');
    await this.access.requireMembership(user.id, participant.workspaceId);
    return this.reportFor(participant);
  }

  /** Shared by the staff report and the public shareCode report. */
  async reportFor(participant: Participant) {
    const [group, workspace, latest] = await Promise.all([
      this.db.collection(C.groups).doc(participant.groupId).get(),
      this.db.collection(C.workspaces).doc(participant.workspaceId).get(),
      this.latestAttempt(participant.id),
    ]);
    const activity = latest
      ? fromDoc<ActivitySession>(
          await this.db.collection(C.activities).doc(latest.activityId).get(),
        )
      : null;
    return {
      shareCode: participant.shareCode,
      studentName: participant.displayName,
      groupName: (group.data()?.name as string | undefined) ?? '',
      schoolName: (workspace.data()?.name as string | undefined) ?? '',
      status: latest?.status ?? 'NOT_STARTED',
      startedAt: latest?.startedAt ?? null,
      completedAt: latest?.completedAt ?? null,
      eventsCount: latest?.eventCount ?? 0,
      activityTitle: activity?.title ?? null,
      state:
        latest?.state === null || latest?.state === undefined
          ? null
          : decodeJson(latest.state),
    };
  }

  async createActivity(
    user: AdultUser,
    groupId: string,
    dto: CreateActivityDto,
  ) {
    const group = await this.access.workspaceOfGroup(groupId);
    await this.access.requireMembership(
      user.id,
      group.workspaceId,
      MANAGER_ROLES,
    );
    // Scenario versions are immutable: an existing (scenario, version) pair is
    // reused as-is so historical attempts keep their original manifest.
    const svId = encodeURIComponent(`${dto.scenario}@${dto.version}`);
    const svRef = this.db.collection(C.scenarioVersions).doc(svId);
    const id = randomUUID();
    const activity: ActivitySession = {
      id,
      groupId,
      workspaceId: group.workspaceId,
      scenarioVersionId: svId,
      title: dto.title,
      status: 'DRAFT',
      openedAt: null,
      closedAt: null,
      createdById: user.id,
      createdAt: new Date(),
    };
    const scenarioVersion = await this.db.runTransaction(async (tx) => {
      const existing = fromDoc<ScenarioVersion>(await tx.get(svRef));
      let sv: ScenarioVersion;
      if (existing) {
        sv = { ...existing, manifest: decodeJson(existing.manifest) };
      } else {
        sv = {
          id: svId,
          scenario: dto.scenario,
          version: dto.version,
          manifest: dto.manifest ?? {},
          createdAt: new Date(),
        };
        const { id: _id, ...data } = sv;
        tx.create(svRef, { ...data, manifest: encodeJson(sv.manifest) });
      }
      const { id: _aid, ...aData } = activity;
      tx.create(this.db.collection(C.activities).doc(id), aData);
      return sv;
    });
    return { ...activity, scenarioVersion };
  }

  async setActivityStatus(
    user: AdultUser,
    activityId: string,
    action: 'open' | 'close',
  ) {
    const activity = await this.access.workspaceOfActivity(activityId);
    await this.access.requireMembership(
      user.id,
      activity.workspaceId,
      MANAGER_ROLES,
    );
    const ref = this.db.collection(C.activities).doc(activityId);
    const now = new Date();
    if (action === 'open') {
      if (activity.status !== 'DRAFT') {
        throw new BadRequestException('Only draft activities can be opened');
      }
      await ref.update({ status: 'OPEN', openedAt: now });
      return { ...activity, status: 'OPEN' as const, openedAt: now };
    }
    if (activity.status !== 'OPEN') {
      throw new BadRequestException('Only open activities can be closed');
    }
    await ref.update({ status: 'CLOSED', closedAt: now });
    return { ...activity, status: 'CLOSED' as const, closedAt: now };
  }

  async getActivity(user: AdultUser, activityId: string) {
    const activity = await this.access.workspaceOfActivity(activityId);
    await this.access.requireMembership(user.id, activity.workspaceId);
    const [svSnap, attemptsSnap] = await Promise.all([
      this.db.collection(C.scenarioVersions).doc(activity.scenarioVersionId).get(),
      this.db
        .collection(C.attempts)
        .where('activityId', '==', activityId)
        .orderBy('startedAt', 'asc')
        .get(),
    ]);
    const sv = fromDoc<ScenarioVersion>(svSnap);
    const attempts = attemptsSnap.docs.map((d) => fromDoc<GameAttempt>(d)!);
    const names = attempts.length
      ? await this.db.getAll(
          ...[...new Set(attempts.map((a) => a.participantId))].map((id) =>
            this.db.collection(C.participants).doc(id),
          ),
        )
      : [];
    const nameById = new Map(
      names
        .filter((s) => s.exists)
        .map((s) => [s.id, s.data()!.displayName as string]),
    );
    return {
      ...activity,
      scenarioVersion: sv ? { ...sv, manifest: decodeJson(sv.manifest) } : null,
      attempts: attempts.map((a) => ({
        ...attemptView(a),
        participant: {
          id: a.participantId,
          displayName: nameById.get(a.participantId) ?? '',
        },
      })),
    };
  }
}

class CodeTaken extends Error {}

