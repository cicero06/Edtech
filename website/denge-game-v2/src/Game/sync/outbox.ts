/**
 * Persistent client outbox (IndexedDB).
 *
 * Events land here *before* they hit the network so a refresh, a closed tab
 * or a dropped connection never silently loses them. The engine removes a
 * record only after the server acknowledges it. Meta keys keep the per-
 * attempt sequence counter and the latest unsent state snapshot.
 *
 * Everything is attempt-scoped: two participants on one device never share
 * a queue.
 */

export interface OutboxEvent {
  /** `${attemptId}:${clientEventId}` — primary key. */
  id: string;
  attemptId: string;
  sequence: number;
  envelope: EventEnvelope;
  queuedAt: number;
}

export interface EventEnvelope {
  clientEventId: string;
  sequence: number;
  type: string;
  payloadSchemaVersion: number;
  occurredAt: string;
  payload: Record<string, unknown>;
}

const DB_NAME = 'denge-sync';
const DB_VERSION = 1;
const EVENTS = 'events';
const META = 'meta';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(EVENTS)) {
        const store = db.createObjectStore(EVENTS, { keyPath: 'id' });
        store.createIndex('attemptId', 'attemptId', { unique: false });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function request<T>(
  db: IDBDatabase,
  store: string,
  run: (s: IDBObjectStore) => IDBRequest<T>,
  mode: IDBTransactionMode = 'readonly',
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const req = run(db.transaction(store, mode).objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putEvents(records: OutboxEvent[]): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(EVENTS, 'readwrite');
    for (const record of records) transaction.objectStore(EVENTS).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function pendingEvents(attemptId: string): Promise<OutboxEvent[]> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db
          .transaction(EVENTS)
          .objectStore(EVENTS)
          .index('attemptId')
          .getAll(attemptId);
        request.onsuccess = () =>
          resolve(
            (request.result as OutboxEvent[]).sort(
              (a, b) => a.sequence - b.sequence,
            ),
          );
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function removeEvents(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(EVENTS, 'readwrite');
    for (const id of ids) transaction.objectStore(EVENTS).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getMeta<T>(key: string): Promise<T | null> {
  const db = await open();
  const row = await request<{ key: string; value: T } | undefined>(
    db,
    META,
    (store) => store.get(key),
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await open();
  // Writes need a readwrite transaction; the default (readonly) threw
  // ReadOnlyError here, which aborted every flush — nothing ever synced.
  await request(db, META, (store) => store.put({ key, value }), 'readwrite');
}
