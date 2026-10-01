import {
  BadRequestException,
  ConflictException,
  Injectable,
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
    return this.prisma.group.findUniqueOrThrow({
      where: { id: groupId },
      include: {
        participants: { orderBy: { createdAt: 'asc' } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });
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
      throw new ConflictException('Participant name is already used');
    }
    return this.prisma.participant.create({
      data: {
        groupId,
        displayName: dto.displayName.trim(),
        avatar: dto.avatar,
      },
    });
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
