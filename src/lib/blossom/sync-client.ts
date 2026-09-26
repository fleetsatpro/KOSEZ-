import type { SyncMutation, SyncResult } from "./sync-types";
import { createSerialQueue } from "./sync-queue";

const DB_NAME = "kosez-blossom-sync";
const STORE = "outbox";
const DB_VERSION = 1;
const OUTBOX_FALLBACK_KEY = "kosez-blossom-outbox-v1";
const DEVICE_KEY = "kosez-blossom-device-id";
const CHANGE_EVENT = "kosez:sync-needed";
let activeOwnerId: string | null = null;
const enqueueQueue = createSerialQueue();

export type StoredMutation = SyncMutation & {
  state: "pending" | "conflict";
  conflict?: Extract<SyncResult, { status: "conflict" }>;
};

function randomUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "m-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id = randomUuid();
    window.localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return "ephemeral-" + randomUuid();
  }
}

function hasIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function emitSyncNeeded(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

function openDb(): Promise<IDBDatabase> {
  if (!hasIndexedDb()) return Promise.reject(new Error("indexeddb-unavailable"));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "mutationId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexeddb-open-failed"));
  });
}

function readFallback(): StoredMutation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OUTBOX_FALLBACK_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredMutation[]) : [];
  } catch {
    return [];
  }
}

function writeFallback(items: StoredMutation[]): void {
  try {
    window.localStorage.setItem(OUTBOX_FALLBACK_KEY, JSON.stringify(items));
  } catch {
    // A browser with neither IndexedDB nor usable localStorage cannot provide
    // durable offline queuing; the in-memory store still remains responsive.
  }
}

function txRequest<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("indexeddb-request-failed"));
        tx.onabort = () => reject(tx.error ?? new Error("indexeddb-transaction-aborted"));
        tx.oncomplete = () => db.close();
      }),
  );
}

export function syncChangeEventName(): string {
  return CHANGE_EVENT;
}

export function setSyncOwner(userId: string | null): void {
  activeOwnerId = userId;
  emitSyncNeeded();
}

export function createMutation(
  input: Omit<SyncMutation, "mutationId" | "deviceId" | "createdAt">,
): SyncMutation {
  return {
    ...input,
    ...(activeOwnerId ? { ownerUserId: activeOwnerId } : {}),
    mutationId: randomUuid(),
    deviceId: getDeviceId(),
    createdAt: new Date().toISOString(),
  };
}

async function enqueueMutationNow(mutation: SyncMutation): Promise<void> {
  const item: StoredMutation = { ...mutation, state: "pending" };
  if (!item.ownerUserId && activeOwnerId) {
    item.ownerUserId = activeOwnerId;
  }
  if (hasIndexedDb()) {
    try {
      await txRequest("readwrite", (store) => store.put(item));
      emitSyncNeeded();
      return;
    } catch {
      // Fall through to localStorage for browsers where IDB is temporarily
      // blocked (private modes / storage partition changes).
    }
  }
  const items = readFallback().filter((entry) => entry.mutationId !== item.mutationId);
  items.push(item);
  writeFallback(items);
  emitSyncNeeded();
}


export function enqueueMutation(mutation: SyncMutation): Promise<void> {
  // Serialize durable writes and their sync-needed signals. Without this,
  // two immediate causal actions can race at the storage layer: the dependent
  // mutation may become visible to the bridge before its source mutation.
  return enqueueQueue.enqueue(() => enqueueMutationNow(mutation));
}

export async function listPendingMutations(): Promise<StoredMutation[]> {
  if (hasIndexedDb()) {
    try {
      const rows = await txRequest<StoredMutation[]>("readonly", (store) => store.getAll());
          return rows
        .filter(
          (row) =>
            row.state === "pending" &&
            Boolean(activeOwnerId) &&
            row.ownerUserId === activeOwnerId,
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } catch {
      // fallback below
    }
  }
  return readFallback()
    .filter(
      (row) =>
        row.state === "pending" &&
        Boolean(activeOwnerId) &&
        row.ownerUserId === activeOwnerId,
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function markConflict(
  mutationId: string,
  conflict: Extract<SyncResult, { status: "conflict" }>,
): Promise<void> {
  if (hasIndexedDb()) {
    try {
      const row = await txRequest<StoredMutation | undefined>("readwrite", (store) =>
        store.get(mutationId),
      );
      if (row) {
        row.state = "conflict";
        row.conflict = conflict;
        await txRequest("readwrite", (store) => store.put(row));
        return;
      }
    } catch {
      // fallback below
    }
  }
  const items = readFallback().map((row) =>
    row.mutationId === mutationId ? { ...row, state: "conflict" as const, conflict } : row,
  );
  writeFallback(items);
}

export async function removeMutation(mutationId: string): Promise<void> {
  if (hasIndexedDb()) {
    try {
      await txRequest("readwrite", (store) => store.delete(mutationId));
      return;
    } catch {
      // fallback below
    }
  }
  writeFallback(readFallback().filter((row) => row.mutationId !== mutationId));
}

export async function outboxCount(): Promise<number> {
  return (await listPendingMutations()).length;
}

export async function mutationStatusCounts(): Promise<{
  pending: number;
  conflicts: number;
}> {
  if (hasIndexedDb()) {
    try {
      const rows = await txRequest<StoredMutation[]>("readonly", (store) => store.getAll());
      return rows
        .filter((row) => Boolean(activeOwnerId) && row.ownerUserId === activeOwnerId)
        .reduce(
          (acc, row) => {
            if (row.state === "pending") acc.pending += 1;
            if (row.state === "conflict") acc.conflicts += 1;
            return acc;
          },
          { pending: 0, conflicts: 0 },
        );
    } catch {
      // fallback below
    }
  }

  return readFallback()
    .filter((row) => Boolean(activeOwnerId) && row.ownerUserId === activeOwnerId)
    .reduce(
      (acc, row) => {
        if (row.state === "pending") acc.pending += 1;
        if (row.state === "conflict") acc.conflicts += 1;
        return acc;
      },
      { pending: 0, conflicts: 0 },
    );
}

export async function replaceConflictWithMutation(
  conflictMutationId: string,
  merged: SyncMutation,
): Promise<void> {
  // Enqueue first. If storage fails, the conflict record remains intact and no
  // local command is silently discarded.
  await enqueueMutation(merged);
  await removeMutation(conflictMutationId);
}
