import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { C } from '../../firebase/collections.js';
import { FirebaseService, fromDoc } from '../../firebase/firebase.service.js';
import type {
  ActivitySession,
  GameAttempt,
  Group,
  MemberRole,
  Membership,
} from '../../firebase/models.js';

const MANAGER_ROLES: MemberRole[] = ['OWNER', 'FACILITATOR'];

export function membershipId(workspaceId: string, userId: string) {
  return `${workspaceId}_${userId}`;
}

@Injectable()
export class AccessService {
  constructor(private readonly firebase: FirebaseService) {}

  private get db() {
    return this.firebase.db;
  }

  async requireMembership(
    userId: string,
    workspaceId: string,
    roles: MemberRole[] = [...MANAGER_ROLES, 'VIEWER'],
  ): Promise<Membership> {
    const membership = fromDoc<Membership>(
      await this.db
        .collection(C.memberships)
        .doc(membershipId(workspaceId, userId))
        .get(),
    );
    if (
      !membership ||
      membership.status !== 'ACTIVE' ||
      !roles.includes(membership.role)
    ) {
      throw new ForbiddenException('No access to this workspace');
    }
    return membership;
  }

  async workspaceOfGroup(groupId: string): Promise<Group> {
    const group = fromDoc<Group>(
      await this.db.collection(C.groups).doc(groupId).get(),
    );
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async workspaceOfActivity(activityId: string): Promise<ActivitySession> {
    const activity = fromDoc<ActivitySession>(
      await this.db.collection(C.activities).doc(activityId).get(),
    );
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async attempt(attemptId: string): Promise<GameAttempt> {
    const attempt = fromDoc<GameAttempt>(
      await this.db.collection(C.attempts).doc(attemptId).get(),
    );
    if (!attempt) throw new NotFoundException('Attempt not found');
    return attempt;
  }
}

export { MANAGER_ROLES };
