/**
 * Sync engine — the bridge between the synchronous localStorage session
 * (which GameScene/audio read without awaiting) and the Atlas backend.
 *
 * Design (plan Phase 3):
 * - Events enter a persistent IndexedDB outbox *first*; the network flush is
 *   a separate step. A retry resends the same `clientEventId`, so the server
 *   deduplicates instead of double-recording.
 * - The latest GameSession snapshot travels as `state` guarded by
 *   `baseRevision`; only the newest snapshot is ever sent.
 * - Status is observable (`synced` / `pending` / `syncing` / `offline` /
 *   `error`) so the UI can show "sunucuya kaydedildi" only after the ACK.
 *
 * Nothing here imports session.ts — session.ts calls into this module.
 */

import { joinActivity, syncAttempt, getAttempt, ApiError } from './api';
import {
  pendingEvents,
  putEvents,
  removeEvents,
  getMeta,
  setMeta,
  type EventEnvelope,
} from './outbox';

export type SyncStatus =
  | 'local' // no remote attempt bound — pure localStorage mode
  | 'synced' // server acknowledged everything queued
  | 'pending' // outbox has records the server has not acked yet
  | 'syncing' // a flush is in flight
  | 'offline' // network down; queued records are safe
  | 'error'; // the server rejected us — needs attention, not blind retry

export interface RemoteBinding {
  attemptId: string;
  participantId: string;
  token: string;
  revision: number;
}

interface RemoteContext extends RemoteBinding {
  joinCode: string;
  displayName: string;
}

const REMOTE_KEY = 'denge:v2:remote';
const BATCH_SIZE = 100;
const RETRY_MS = [2_000, 5_000, 15_000, 60_000];

let binding: RemoteBinding | null = null;
let nextSequence = 0;
let dirtyState: unknown = null;
let stateDirty = false;
let flushing = false;
let retryTimer: number | null = null;
let retryStep = 0;
let status: SyncStatus = 'local';
const listeners = new Set<(s: SyncStatus) => void>();

// Serialise enqueue + flush so sequences never interleave.
let chain: Promise<unknown> = Promise.resolve();
const queue = <T>(job: () => Promise<T>): Promise<T> => {
  const run = chain.then(job);
  chain = run.catch(() => undefined);
  return run;
};

function setStatus(next: SyncStatus) {
  if (status === next) return;
  status = next;
  for (const listener of listeners) listener(next);
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSyncStatus(listener: (s: SyncStatus) => void) {
  listeners.add(listener);
  listener(status);
  return () => {
    listeners.delete(listener);
  };
}

export function getRemoteContext(): RemoteContext | null {
  if (binding) {
    return { ...binding, joinCode: '', displayName: '' };
  }
  try {
    const raw = localStorage.getItem(REMOTE_KEY);
    return raw ? (JSON.parse(raw) as RemoteContext) : null;
  } catch {
    return null;
  }
}

function persistContext(ctx: RemoteContext): void {
  try {
    localStorage.setItem(REMOTE_KEY, JSON.stringify(ctx));
  } catch {
    /* private mode — remote play still works until the tab closes */
  }
}

/** Drop the server binding — e.g. a different participant picked. */
export function unbindAttempt(): void {
  binding = null;
  dirtyState = null;
  stateDirty = false;
  try {
    localStorage.removeItem(REMOTE_KEY);
  } catch {
    /* ignore */
  }
  setStatus('local');
}

function safeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      /* fallback */
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Attach the engine to a server attempt. Loads the outbox sequence counter,
 * queues `attempt_started` for brand-new attempts, then flushes whatever a
 * previous visit left behind.
 */
export function bindAttempt(input: {
  attemptId: string;
  participantId: string;
  token: string;
  revision: number;
  joinCode?: string;
  displayName?: string;
  /** True when the server attempt has no state yet — first ever sync. */
  fresh: boolean;
}): Promise<void> {
  const { fresh, ...rest } = input;
  binding = {
    attemptId: rest.attemptId,
    participantId: rest.participantId,
    token: rest.token,
    revision: rest.revision,
  };
  persistContext({
    ...binding,
    joinCode: rest.joinCode ?? '',
    displayName: rest.displayName ?? '',
  });
  return queue(async () => {
    try {
      nextSequence =
        (await getMeta<number>(`seq:${rest.attemptId}`)) ?? 0;
      if (fresh) await enqueueInternal('attempt_started', {});
      setStatus('pending');
      scheduleFlush(0);
    } catch (e) {
      console.warn('Outbox storage warning:', e);
    }
  });
}

/** session.recordEvent → here. Session type names map to API event types. */
const EVENT_TYPE_MAP: Record<string, string> = {
  choice: 'choice_made',
  investigation: 'investigation_completed',
  evidence: 'evidence_submitted',
  plan: 'plan_submitted',
  announce: 'announcement_submitted',
  report: 'report_classified',
  'alt-plan': 'alt_plan_submitted',
  finale: 'finale_submitted',
  minigame: 'minigame_completed',
};

export function noteEvent(
  sessionType: string,
  data: Record<string, unknown> | undefined,
  studentId: string,
): void {
  const bound = binding;
  if (!bound || bound.participantId !== studentId) return;
  const type = EVENT_TYPE_MAP[sessionType];
  if (!type) return;
  void queue(async () => {
    await enqueueInternal(type, data ?? {});
    // The finale doubles as the attempt's completion marker.
    if (sessionType === 'finale') {
      await enqueueInternal('attempt_completed', {});
    }
    setStatus('pending');
    scheduleFlush(0);
  });
}

/**
 * session.saveSession → here. Keeps only the newest snapshot; the flush
 * piggybacks it on the next event batch (or sends it alone when idle).
 */
export function noteState(
  session: { studentId: string },
  fullSnapshot: unknown,
): void {
  const bound = binding;
  if (!bound || bound.participantId !== session.studentId) return;
  dirtyState = fullSnapshot;
  stateDirty = true;
  void queue(async () => {
    await setMeta(`state:${bound.attemptId}`, fullSnapshot);
    setStatus('pending');
    scheduleFlush(1_500); // coalesce rapid saveSession bursts
  });
}

async function enqueueInternal(
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const bound = binding;
  if (!bound) return;
  const envelope: EventEnvelope = {
    clientEventId: safeUUID(),
    sequence: nextSequence++,
    type,
    payloadSchemaVersion: 1,
    occurredAt: new Date().toISOString(),
    payload,
  };
  await putEvents([
    {
      id: `${bound.attemptId}:${envelope.clientEventId}`,
      attemptId: bound.attemptId,
      sequence: envelope.sequence,
      envelope,
      queuedAt: Date.now(),
    },
  ]);
  await setMeta(`seq:${bound.attemptId}`, nextSequence);
}

function scheduleFlush(delayMs: number): void {
  if (retryTimer !== null) window.clearTimeout(retryTimer);
  retryTimer = window.setTimeout(() => void flush(), delayMs);
}

async function flush(): Promise<void> {
  const bound = binding;
  if (!bound || flushing) return;
  flushing = true;
  try {
    const pending = (await pendingEvents(bound.attemptId)).slice(
      0,
      BATCH_SIZE,
    );
    if (!pending.length && !stateDirty) {
      setStatus('synced');
      return;
    }
    setStatus('syncing');
    const body: Parameters<typeof syncAttempt>[2] = {
      events: pending.map((record) => record.envelope),
    };
    if (stateDirty) {
      body.state = dirtyState;
      body.baseRevision = bound.revision;
    }
    const result = await syncAttempt(bound.attemptId, bound.token, body);
    await removeEvents(pending.map((record) => record.id));
    if (stateDirty) {
      stateDirty = false;
      dirtyState = null;
      await setMeta(`state:${bound.attemptId}`, null);
    }
    bound.revision = result.revision;
    retryStep = 0;
    const remaining = await pendingEvents(bound.attemptId);
    if (remaining.length) {
      scheduleFlush(0); // more than one batch was waiting
    } else {
      setStatus('synced');
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 409 && stateDirty) {
      // Stale baseRevision: adopt the server's revision and retry once.
      try {
        const fresh = await getAttempt(bound.attemptId, bound.token);
        bound.revision = fresh.revision;
      } catch {
        /* fall through to generic retry */
      }
      scheduleFlush(RETRY_MS[Math.min(retryStep++, RETRY_MS.length - 1)]);
    } else if (error instanceof ApiError && error.status < 500) {
      // 4xx other than the healed 409: the server rejected the data or the
      // token. Retrying forever would never succeed — surface it instead.
      setStatus('error');
    } else {
      setStatus(navigator.onLine ? 'pending' : 'offline');
      scheduleFlush(RETRY_MS[Math.min(retryStep++, RETRY_MS.length - 1)]);
    }
  } finally {
    flushing = false;
  }
}

// ---------------------------------------------------------------------------
// Public entry points used by the gate/App
// ---------------------------------------------------------------------------

export interface RemoteJoinResult {
  participantId: string;
  attemptId: string;
  token: string;
  revision: number;
  resumedState: unknown | null;
}

/**
 * Facilitator-gated entry: roster name + group code → participant token +
 * attempt. Throws ApiError (403) for names not on the roster.
 */
export async function joinRemote(
  joinCode: string,
  displayName: string,
): Promise<RemoteJoinResult> {
  const result = await joinActivity({
    joinCode: joinCode.trim().toUpperCase(),
    displayName: displayName.trim(),
    clientAttemptId: safeUUID(),
  });
  return {
    participantId: result.attempt.participantId,
    attemptId: result.attempt.id,
    token: result.token,
    revision: result.attempt.revision,
    resumedState:
      (result.attempt.state?.state as unknown | undefined) ?? null,
  };
}

/**
 * Cold start: the page reloaded mid-attempt. Rebinds to the stored attempt
 * so pending outbox records flush and future writes keep syncing.
 */
export async function restoreRemote(activeStudentId: string | null) {
  const ctx = getRemoteContext();
  if (!ctx || ctx.participantId !== activeStudentId) return;
  await bindAttempt({
    attemptId: ctx.attemptId,
    participantId: ctx.participantId,
    token: ctx.token,
    revision: ctx.revision,
    joinCode: ctx.joinCode,
    displayName: ctx.displayName,
    fresh: false,
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (binding) scheduleFlush(0);
  });
}
