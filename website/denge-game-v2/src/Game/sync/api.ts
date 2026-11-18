/**
 * Thin REST client for the Atlas v2 API (demo/backend, /v2 routes).
 * Base URL comes from VITE_API_URL; localhost is the dev default.
 */

import type { AiSessionProfile, KadimResult } from '../data/session';

const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000';

export interface JoinResult {
  token: string;
  attempt: {
    id: string;
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    revision: number;
    participantId: string;
    scenarioVersionId: string;
    /** Server-side AttemptState snapshot; null for a fresh attempt. */
    state: { state: unknown } | null;
  };
}

export interface SyncResult {
  accepted: number;
  skipped: number;
  revision: number;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function call<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ApiError(response.status, body || response.statusText);
  }
  return (await response.json()) as T;
}

export function joinActivity(input: {
  joinCode: string;
  displayName: string;
  clientAttemptId?: string;
  restart?: boolean;
}): Promise<JoinResult> {
  return call<JoinResult>('/v2/join', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getAttempt(
  attemptId: string,
  token: string,
): Promise<JoinResult['attempt']> {
  return call(`/v2/attempts/${attemptId}`, {}, token);
}

export function syncAttempt(
  attemptId: string,
  token: string,
  body: {
    events?: unknown[];
    state?: unknown;
    baseRevision?: number;
  },
): Promise<SyncResult> {
  return call<SyncResult>(`/v2/attempts/${attemptId}/sync`, {
    method: 'POST',
    body: JSON.stringify(body),
  }, token);
}

// ---------------------------------------------------------------------------
// Staff management (facilitator console)
//
// `StaffAuth` carries either a Firebase ID token (`token` — the production path,
// backend resolves it to an adult principal) or a dev handle (`subject`,
// sent as `x-atlas-user` — the backend ignores it in production).
// ---------------------------------------------------------------------------

export interface StaffAuth {
  token?: string;
  subject?: string;
}

export interface RemoteWorkspace {
  id: string;
  kind: 'SCHOOL' | 'PILOT';
  name: string;
}

export interface RemoteParticipant {
  id: string;
  groupId: string;
  displayName: string;
  studentNo?: string | null;
  avatar?: string | null;
  createdAt: string;
  shareCode?: string;
  latestAttempt?: {
    id: string;
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    startedAt: string;
    completedAt?: string | null;
    revision: number;
    state?: { state: unknown } | null;
    _count?: { events: number };
  } | null;
}

export interface RemoteGroup {
  id: string;
  name: string;
  joinCode: string;
  participants?: RemoteParticipant[];
  activities?: RemoteActivity[];
}

export interface RemoteActivity {
  id: string;
  title: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  scenarioVersionId: string;
  attempts?: {
    id: string;
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    revision: number;
    startedAt: string;
    participant: { id: string; displayName: string };
    _count: { events: number };
  }[];
}

export interface PublicReportResult {
  shareCode: string;
  studentName: string;
  groupName: string;
  schoolName: string;
  status: 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  startedAt: string | null;
  completedAt: string | null;
  eventsCount: number;
  activityTitle: string | null;
  state: {
    stats?: {
      environment: number;
      economy: number;
      society: number;
      water: number;
    };
    notebook?: { cardId: string; icon: string; text: string; datum?: string }[];
    evidence?: string[];
    plan?: { solutionIds: string[]; totalCost: number; rationale?: string } | null;
    altPlan?: { solutionIds: string[]; totalCost: number; rationale?: string } | null;
    kadim?: KadimResult;
    aiProfile?: AiSessionProfile;
    report?: { workedIds: string[]; problemIds: string[] };
    finalStatement?: string;
    quest?: string;
  } | null;
}

export function getPublicReport(shareCode: string): Promise<PublicReportResult> {
  return call<PublicReportResult>(`/v2/reports/${encodeURIComponent(shareCode)}`);
}

function staffCall<T>(
  path: string,
  auth: StaffAuth,
  init: RequestInit = {},
): Promise<T> {
  return call<T>(path, {
    ...init,
    headers: auth.token
      ? { Authorization: `Bearer ${auth.token}` }
      : { 'x-atlas-user': auth.subject ?? '' },
  });
}

export function staffCreateWorkspace(
  auth: StaffAuth,
  input: { kind: 'SCHOOL' | 'PILOT'; name: string },
) {
  return staffCall<RemoteWorkspace>('/v2/workspaces', auth, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function staffListWorkspaces(auth: StaffAuth) {
  const rows = await staffCall<
    { role: string; workspace: RemoteWorkspace }[]
  >('/v2/workspaces', auth);
  return rows;
}

export function staffListGroups(auth: StaffAuth, workspaceId: string) {
  return staffCall<RemoteGroup[]>(
    `/v2/workspaces/${workspaceId}/groups`,
    auth,
  );
}

export function staffCreateGroup(
  auth: StaffAuth,
  workspaceId: string,
  name: string,
) {
  return staffCall<RemoteGroup>(`/v2/workspaces/${workspaceId}/groups`, auth, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function staffDeleteGroup(
  auth: StaffAuth,
  workspaceId: string,
  groupId: string,
) {
  return staffCall<{ id: string }>(
    `/v2/workspaces/${workspaceId}/groups/${groupId}`,
    auth,
    { method: 'DELETE' },
  );
}

export function staffGetGroup(auth: StaffAuth, groupId: string) {
  return staffCall<RemoteGroup>(`/v2/groups/${groupId}`, auth);
}

export function staffAddParticipant(
  auth: StaffAuth,
  groupId: string,
  displayName: string,
) {
  return staffCall<{ id: string; shareCode?: string }>(
    `/v2/groups/${groupId}/participants`,
    auth,
    {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    },
  );
}

export function staffDeleteParticipant(
  auth: StaffAuth,
  groupId: string,
  participantId: string,
) {
  return staffCall<{ id: string }>(
    `/v2/groups/${groupId}/participants/${participantId}`,
    auth,
    { method: 'DELETE' },
  );
}

export function staffGetParticipantReport(
  auth: StaffAuth,
  participantId: string,
): Promise<PublicReportResult> {
  return staffCall<PublicReportResult>(
    `/v2/participants/${participantId}/report`,
    auth,
  );
}

export function staffCreateActivity(
  auth: StaffAuth,
  groupId: string,
  input: {
    title: string;
    scenario: string;
    version: string;
    manifest: Record<string, unknown>;
  },
) {
  return staffCall<RemoteActivity>(`/v2/groups/${groupId}/activities`, auth, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function staffSetActivityStatus(
  auth: StaffAuth,
  activityId: string,
  action: 'open' | 'close',
) {
  return staffCall<RemoteActivity>(
    `/v2/activities/${activityId}/${action}`,
    auth,
    { method: 'POST' },
  );
}

export function staffGetActivity(auth: StaffAuth, activityId: string) {
  return staffCall<RemoteActivity>(`/v2/activities/${activityId}`, auth);
}
