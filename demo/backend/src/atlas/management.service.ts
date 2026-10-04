import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import type { AdultUser } from '../generated/prisma/client.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AccessService, MANAGER_ROLES } from './auth/access.service.js';
import type {
  CreateActivityDto,
  CreateGroupDto,
  CreateParticipantDto,
  CreateWorkspaceDto,
} from './dto/management.dto.js';

const JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateJoinCode(): string {
  return Array.from({ length: 6 }, () =>
    JOIN_CODE_ALPHABET.charAt(randomInt(JOIN_CODE_ALPHABET.length)),
  ).join('');
}

@Injectable()
export class ManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  createWorkspace(user: AdultUser, dto: CreateWorkspaceDto) {
    return this.prisma.workspace.create({
      data: {
        kind: dto.kind,
        name: dto.name,
        province: dto.province,
        district: dto.district,
        mebCode: dto.mebCode,
        members: {
          create: { userId: user.id, role: 'OWNER' },
        },
      },
    });
  }

  listWorkspaces(user: AdultUser) {
    return this.prisma.membership.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { workspace: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listGroups(user: AdultUser, workspaceId: string) {
    await this.access.requireMembership(user.id, workspaceId);
    return this.prisma.group.findMany({
      where: { workspaceId },
      select: { id: true, name: true, joinCode: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createGroup(user: AdultUser, workspaceId: string, dto: CreateGroupDto) {
    await this.access.requireMembership(user.id, workspaceId, MANAGER_ROLES);
    return this.prisma.group.create({
      data: {
        workspaceId,
        name: dto.name,
        joinCode: generateJoinCode(),
      },
    });
  }

  async getGroup(user: AdultUser, groupId: string) {
    const group = await this.access.workspaceOfGroup(groupId);
    await this.access.requireMembership(user.id, group.workspaceId);
    const row = await this.prisma.group.findUniqueOrThrow({
      where: { id: groupId },
      include: {
        participants: {
          orderBy: { createdAt: 'asc' },
          include: {
            attempts: {
              select: {
                id: true,
                status: true,
                startedAt: true,
                completedAt: true,
                revision: true,
                state: true,
                _count: { select: { events: true } },
              },
              orderBy: { startedAt: 'desc' },
              take: 1,
            },
          },
        },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });

    return {
      ...row,
      participants: row.participants.map((p) => ({
        id: p.id,
        groupId: p.groupId,
        displayName: p.displayName,
        studentNo: p.studentNo,
        avatar: p.avatar,
        createdAt: p.createdAt,
        shareCode: `DNGA-${p.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`,
        latestAttempt: p.attempts[0] ?? null,
      })),
    };
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
    const existing = await this.prisma.participant.findFirst({
      where: {
        groupId,
        displayName: { equals: dto.displayName.trim(), mode: 'insensitive' },
      },
    });
    if (existing) {
      throw new ConflictException('Bu isimde bir katılımcı grupta zaten kayıtlı');
    }
    const created = await this.prisma.participant.create({
      data: {
        groupId,
        displayName: dto.displayName.trim(),
        avatar: dto.avatar,
      },
    });
    return {
      ...created,
      shareCode: `DNGA-${created.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`,
    };
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
    const participant = await this.prisma.participant.findFirst({
      where: { id: participantId, groupId },
    });
    if (!participant) throw new NotFoundException('Öğrenci bulunamadı');

    const attempts = await this.prisma.gameAttempt.findMany({
      where: { participantId },
      select: { id: true },
    });
    const attemptIds = attempts.map((a) => a.id);

    return this.prisma.$transaction(async (tx) => {
      if (attemptIds.length > 0) {
        await tx.learningEvent.deleteMany({
          where: { attemptId: { in: attemptIds } },
        });
        await tx.attemptState.deleteMany({
          where: { attemptId: { in: attemptIds } },
        });
        await tx.gameAttempt.deleteMany({
          where: { id: { in: attemptIds } },
        });
      }
      await tx.participantToken.deleteMany({
        where: { participantId },
      });
      return tx.participant.delete({
        where: { id: participantId },
      });
    });
  }

  async deleteGroup(user: AdultUser, workspaceId: string, groupId: string) {
    await this.access.requireMembership(user.id, workspaceId, MANAGER_ROLES);
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, workspaceId },
      include: {
        participants: { select: { id: true } },
        activities: { select: { id: true } },
      },
    });
    if (!group) throw new NotFoundException('Grup bulunamadı');

    const participantIds = group.participants.map((p) => p.id);
    const activityIds = group.activities.map((a) => a.id);

    return this.prisma.$transaction(async (tx) => {
      const attempts = await tx.gameAttempt.findMany({
        where: {
          OR: [
            { participantId: { in: participantIds } },
            { activityId: { in: activityIds } },
          ],
        },
        select: { id: true },
      });
      const attemptIds = attempts.map((a) => a.id);

      if (attemptIds.length > 0) {
        await tx.learningEvent.deleteMany({
          where: { attemptId: { in: attemptIds } },
        });
        await tx.attemptState.deleteMany({
          where: { attemptId: { in: attemptIds } },
        });
        await tx.gameAttempt.deleteMany({
          where: { id: { in: attemptIds } },
        });
      }

      await tx.participantToken.deleteMany({
        where: { participantId: { in: participantIds } },
      });
      await tx.participant.deleteMany({
        where: { groupId },
      });
      await tx.activitySession.deleteMany({
        where: { groupId },
      });
      return tx.group.delete({
        where: { id: groupId },
      });
    });
  }

  async getParticipantReport(user: AdultUser, participantId: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        group: {
          include: {
            workspace: true,
          },
        },
      },
    });
    if (!participant) throw new NotFoundException('Öğrenci bulunamadı');
    await this.access.requireMembership(user.id, participant.group.workspaceId);

    const latestAttempt = await this.prisma.gameAttempt.findFirst({
      where: { participantId: participant.id },
      orderBy: { startedAt: 'desc' },
      include: {
        state: true,
        activity: true,
        _count: { select: { events: true } },
      },
    });

    return {
      shareCode: `DNGA-${participant.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`,
      studentName: participant.displayName,
      groupName: participant.group.name,
      schoolName: participant.group.workspace.name,
      status: latestAttempt?.status ?? 'NOT_STARTED',
      startedAt: latestAttempt?.startedAt ?? null,
      completedAt: latestAttempt?.completedAt ?? null,
      eventsCount: latestAttempt?._count.events ?? 0,
      activityTitle: latestAttempt?.activity.title ?? null,
      state: latestAttempt?.state?.state ?? null,
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
    const scenarioVersion = await this.prisma.scenarioVersion.upsert({
      where: { scenario_version: { scenario: dto.scenario, version: dto.version } },
      create: {
        scenario: dto.scenario,
        version: dto.version,
        manifest: (dto.manifest ?? {}) as Prisma.InputJsonValue,
      },
      update: {},
    });
    return this.prisma.activitySession.create({
      data: {
        groupId,
        scenarioVersionId: scenarioVersion.id,
        title: dto.title,
        createdById: user.id,
      },
      include: { scenarioVersion: true },
    });
  }

  async setActivityStatus(
    user: AdultUser,
    activityId: string,
    action: 'open' | 'close',
  ) {
    const activity = await this.access.workspaceOfActivity(activityId);
    const group = await this.prisma.group.findUniqueOrThrow({
      where: { id: activity.groupId },
    });
    await this.access.requireMembership(
      user.id,
      group.workspaceId,
      MANAGER_ROLES,
    );
    if (action === 'open') {
      if (activity.status !== 'DRAFT') {
        throw new BadRequestException('Only draft activities can be opened');
      }
      return this.prisma.activitySession.update({
        where: { id: activityId },
        data: { status: 'OPEN', openedAt: new Date() },
      });
    }
    if (activity.status !== 'OPEN') {
      throw new BadRequestException('Only open activities can be closed');
    }
    return this.prisma.activitySession.update({
      where: { id: activityId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
  }

  async getActivity(user: AdultUser, activityId: string) {
    const activity = await this.access.workspaceOfActivity(activityId);
    const group = await this.prisma.group.findUniqueOrThrow({
      where: { id: activity.groupId },
    });
    await this.access.requireMembership(user.id, group.workspaceId);
    return this.prisma.activitySession.findUniqueOrThrow({
      where: { id: activityId },
      include: {
        scenarioVersion: true,
        attempts: {
          include: {
            participant: { select: { id: true, displayName: true } },
            _count: { select: { events: true } },
          },
          orderBy: { startedAt: 'asc' },
        },
      },
    });
  }
}
