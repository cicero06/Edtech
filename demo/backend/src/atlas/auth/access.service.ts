import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const MANAGER_ROLES: MemberRole[] = ['OWNER', 'FACILITATOR'];

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMembership(
    userId: string,
    workspaceId: string,
    roles: MemberRole[] = [...MANAGER_ROLES, 'VIEWER'],
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (
      !membership ||
      membership.status !== 'ACTIVE' ||
      !roles.includes(membership.role)
    ) {
      throw new ForbiddenException('No access to this workspace');
    }
    return membership;
  }

  async workspaceOfGroup(groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async workspaceOfActivity(activityId: string) {
    const activity = await this.prisma.activitySession.findUnique({
      where: { id: activityId },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async attemptWithScope(attemptId: string) {
    const attempt = await this.prisma.gameAttempt.findUnique({
      where: { id: attemptId },
      include: {
        state: true,
        scenarioVersion: true,
        activity: { include: { group: true } },
        participant: true,
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    return attempt;
  }
}

export { MANAGER_ROLES };
