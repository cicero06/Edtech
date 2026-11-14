import { Injectable } from '@nestjs/common';
import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import {
  getFirestore,
  Timestamp,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase-admin/firestore';

/**
 * Single firebase-admin entry point for the HarmonyTown project.
 *
 * Credentials, first match wins:
 * 1. FIRESTORE_EMULATOR_HOST set → emulator, only the project id is needed.
 * 2. FIREBASE_SERVICE_ACCOUNT → the service-account JSON (raw or base64),
 *    used on Vercel where there is no key file on disk.
 * 3. Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS).
 *
 * All client access to Firestore is denied by firestore.rules; only this
 * backend (admin SDK, rules-exempt) reads and writes.
 */
function createApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const projectId = process.env.FIREBASE_PROJECT_ID ?? 'harmonytown';
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId });
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (raw) {
    const json = raw.startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8');
    const account = JSON.parse(json) as ServiceAccount & {
      project_id?: string;
    };
    return initializeApp({
      credential: cert(account),
      projectId: account.project_id ?? projectId,
    });
  }
  return initializeApp({ projectId });
}

let firestoreSingleton: Firestore | null = null;

@Injectable()
export class FirebaseService {
  readonly app: App;
  readonly db: Firestore;
  readonly auth: Auth;

  constructor() {
    this.app = createApp();
    if (!firestoreSingleton) {
      firestoreSingleton = getFirestore(this.app);
      // settings() may only be called once per instance (serverless reuse).
      firestoreSingleton.settings({ ignoreUndefinedProperties: true });
    }
    this.db = firestoreSingleton;
    this.auth = getAuth(this.app);
  }
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/** Recursively turns Firestore Timestamps into Dates (JSON → ISO strings). */
export function plain<T>(value: unknown): T {
  if (value instanceof Timestamp) return value.toDate() as T;
  if (Array.isArray(value)) return value.map((v) => plain(v)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, plain(v)]),
    ) as T;
  }
  return value as T;
}

/** Snapshot → `{ id, ...fields }` with Dates, or null when missing. */
export function fromDoc<T extends { id: string }>(
  snap: DocumentSnapshot,
): T | null {
  if (!snap.exists) return null;
  return { id: snap.id, ...plain<Omit<T, 'id'>>(snap.data()) } as T;
}

/**
 * Firestore rejects arrays directly nested in arrays. Opaque game JSON
 * (state, event payloads, manifests) may contain them, so such values are
 * stored as `{ __json: "<stringified>" }` and decoded on read. Ordinary
 * values stay as native maps so the console remains readable.
 */
function hasNestedArray(value: unknown, inArray = false): boolean {
  if (Array.isArray(value)) {
    if (inArray) return true;
    return value.some((v) => hasNestedArray(v, true));
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some((v) => hasNestedArray(v, false));
  }
  return false;
}

export function encodeJson(value: unknown): unknown {
  if (value === undefined) return null;
  return hasNestedArray(value) ? { __json: JSON.stringify(value) } : value;
}

export function decodeJson<T = unknown>(value: unknown): T {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as { __json?: unknown }).__json === 'string' &&
    Object.keys(value).length === 1
  ) {
    return JSON.parse((value as { __json: string }).__json) as T;
  }
  return value as T;
}

/** Splits an array into chunks (Firestore `in` accepts at most 30 values). */
export function chunk<T>(items: T[], size = 30): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
