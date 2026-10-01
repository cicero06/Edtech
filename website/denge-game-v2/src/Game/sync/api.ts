/**
 * Thin REST client for the Atlas v2 API (demo/backend, /v2 routes).
 * Base URL comes from VITE_API_URL; localhost is the dev default.
 */

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
// Until the Supabase sign-in ships, the staff caller identifies itself with
// the dev-only `x-atlas-user` header — the backend ignores it in production.
// ---------------------------------------------------------------------------

export interface RemoteWorkspace {
  id: string;
  kind: 'SCHOOL' | 'PILOT';
  name: string;
}

export interface RemoteGroup {
  id: string;
  name: string;
  joinCode: string;
  participants?: { id: string; displayName: string }[];
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

function staffCall<T>(
  path: string,
  subject: string,
  init: RequestInit = {},
): Promise<T> {
  return call<T>(path, {
    ...init,
    headers: { 'x-atlas-user': subject },
  });
}

export function staffCreateWorkspace(
  subject: string,
  input: { kind: 'SCHOOL' | 'PILOT'; name: string },
) {
  return staffCall<RemoteWorkspace>('/v2/workspaces', subject, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function staffListWorkspaces(subject: string) {
  const rows = await staffCall<
    { role: string; workspace: RemoteWorkspace }[]
  >('/v2/workspaces', subject);
  return rows.map((row) => row.workspace);
}

export function staffListGroups(subject: string, workspaceId: string) {
  return staffCall<RemoteGroup[]>(
    `/v2/workspaces/${workspaceId}/groups`,
    subject,
  );
}

export function staffCreateGroup(
  subject: string,
  workspaceId: string,
  name: string,
) {
  return staffCall<RemoteGroup>(`/v2/workspaces/${workspaceId}/groups`, subject, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function staffGetGroup(subject: string, groupId: string) {
  return staffCall<RemoteGroup>(`/v2/groups/${groupId}`, subject);
}

export function staffAddParticipant(
  subject: string,
  groupId: string,
  displayName: string,
) {
  return staffCall<{ id: string }>(`/v2/groups/${groupId}/participants`, subject, {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  });
}

export function staffCreateActivity(
  subject: string,
  groupId: string,
  input: {
    title: string;
    scenario: string;
    version: string;
    manifest: Record<string, unknown>;
  },
) {
  return staffCall<RemoteActivity>(`/v2/groups/${groupId}/activities`, subject, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function staffSetActivityStatus(
  subject: string,
  activityId: string,
  action: 'open' | 'close',
) {
  return staffCall<RemoteActivity>(
    `/v2/activities/${activityId}/${action}`,
    subject,
    { method: 'POST' },
  );
}

export function staffGetActivity(subject: string, activityId: string) {
  return staffCall<RemoteActivity>(`/v2/activities/${activityId}`, subject);
}
