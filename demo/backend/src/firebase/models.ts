/** Plain shapes returned by the API (Dates serialize to ISO strings). */

export type WorkspaceKind = 'SCHOOL' | 'PILOT';
export type MemberRole = 'OWNER' | 'FACILITATOR' | 'VIEWER';
export type MemberStatus = 'ACTIVE' | 'SUSPENDED';
export type ActivityStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export type AttemptStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
export type BlogStatus = 'DRAFT' | 'PUBLISHED';

export interface AdultUser {
  id: string;
  authSubject: string;
  displayName: string;
  email: string | null;
  createdAt: Date;
}

export interface Workspace {
  id: string;
  kind: WorkspaceKind;
  name: string;
  province: string | null;
  district: string | null;
  mebCode: string | null;
  createdAt: Date;
}

export interface Membership {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: Date;
}

export interface Group {
  id: string;
  workspaceId: string;
  name: string;
  joinCode: string;
  createdAt: Date;
}

export interface Participant {
  id: string;
  groupId: string;
  workspaceId: string;
  displayName: string;
  displayNameKey: string;
  studentNo: string | null;
  avatar: string | null;
  shareCode: string;
  createdAt: Date;
}

export interface ScenarioVersion {
  id: string;
  scenario: string;
  version: string;
  manifest: unknown;
  createdAt: Date;
}

export interface ActivitySession {
  id: string;
  groupId: string;
  workspaceId: string;
  scenarioVersionId: string;
  title: string;
  status: ActivityStatus;
  openedAt: Date | null;
  closedAt: Date | null;
  createdById: string;
  createdAt: Date;
}

export interface GameAttempt {
  id: string;
  participantId: string;
  activityId: string;
  groupId: string;
  workspaceId: string;
  scenarioVersionId: string;
  clientAttemptId: string;
  status: AttemptStatus;
  revision: number;
  eventCount: number;
  startedAt: Date;
  completedAt: Date | null;
  /** Encoded (see encodeJson); null until the first state sync. */
  state: unknown;
  stateUpdatedAt: Date | null;
}

export interface LearningEvent {
  id: string;
  attemptId: string;
  clientEventId: string;
  sequence: number;
  type: string;
  payloadSchemaVersion: number;
  payload: unknown;
  occurredAt: Date;
  receivedAt: Date;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  tag: string;
  displayDate: string;
  excerpt: string;
  body: unknown;
  authorId: string;
  status: BlogStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Case/whitespace-insensitive roster key (Turkish-aware lowercasing). */
export function nameKey(displayName: string): string {
  return displayName.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr');
}

/** Short parent/teacher report code derived from the participant id. */
export function shareCodeOf(participantId: string): string {
  return `DNGA-${participantId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}
