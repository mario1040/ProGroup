import { useSyncExternalStore } from "react";

export interface PendingMutation {
  id: string; // Deterministic ID: `mut_${collection}_${docId}`
  collection: string;
  docId: string;
  operation: "set" | "update" | "delete";
  data: any;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = "naris_pending_mutations";
const listeners = new Set<() => void>();

let inMemoryQueue: PendingMutation[] = loadQueueFromStorage();
let isSyncing = false;

function loadQueueFromStorage(): PendingMutation[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("[OfflineManager] Failed to read pending mutations from localStorage:", err);
  }
  return [];
}

function saveQueueToStorage(queue: PendingMutation[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("[OfflineManager] Failed to save pending mutations to localStorage:", err);
  }
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (_) {}
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("naris_pending_mutations_changed", {
      detail: { count: inMemoryQueue.length }
    }));
  }
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/**
 * Queue a mutation with strict deduplication by collection and docId.
 * If a document is updated multiple times while offline or quota-exceeded,
 * changes are automatically merged into a single atomic mutation to prevent
 * duplicate records or race conditions.
 */
export function queuePendingMutation(
  collection: string,
  docId: string,
  operation: "set" | "update" | "delete",
  data: any
): PendingMutation {
  const mutationId = `mut_${collection}_${docId}`;
  const now = Date.now();

  const existingIndex = inMemoryQueue.findIndex((m) => m.id === mutationId);
  let mutation: PendingMutation;

  if (existingIndex >= 0) {
    const existing = inMemoryQueue[existingIndex];
    if (operation === "delete") {
      mutation = {
        id: mutationId,
        collection,
        docId,
        operation: "delete",
        data: null,
        timestamp: now,
        retryCount: existing.retryCount
      };
    } else {
      // Merge updates safely without losing previous offline changes
      const mergedData = {
        ...(existing.data || {}),
        ...(data || {}),
        updated_at: new Date().toISOString()
      };
      mutation = {
        ...existing,
        operation: existing.operation === "set" ? "set" : operation,
        data: mergedData,
        timestamp: now
      };
    }
    inMemoryQueue[existingIndex] = mutation;
  } else {
    mutation = {
      id: mutationId,
      collection,
      docId,
      operation,
      data: data ? { ...data } : null,
      timestamp: now,
      retryCount: 0
    };
    inMemoryQueue.push(mutation);
  }

  saveQueueToStorage(inMemoryQueue);
  notifyListeners();
  console.log(`[OfflineManager] Queued mutation safely for ${collection}/${docId} (${operation}). Total pending: ${inMemoryQueue.length}`);
  return mutation;
}

export function getPendingMutations(): PendingMutation[] {
  return [...inMemoryQueue];
}

export function getPendingMutationsCount(): number {
  return inMemoryQueue.length;
}

export function removePendingMutation(id: string): void {
  inMemoryQueue = inMemoryQueue.filter((m) => m.id !== id);
  saveQueueToStorage(inMemoryQueue);
  notifyListeners();
}

export function clearAllPendingMutations(): void {
  inMemoryQueue = [];
  saveQueueToStorage(inMemoryQueue);
  notifyListeners();
}

export function isCurrentlySyncing(): boolean {
  return isSyncing;
}

/**
 * Executes synchronization of all pending mutations through a provided sync handler.
 * Avoids duplicate executions and handles quota / network errors gracefully.
 */
export async function executePendingSync(
  syncItem: (mutation: PendingMutation) => Promise<boolean>
): Promise<{ successCount: number; remainingCount: number }> {
  if (isSyncing || inMemoryQueue.length === 0) {
    return { successCount: 0, remainingCount: inMemoryQueue.length };
  }

  isSyncing = true;
  notifyListeners();

  let successCount = 0;
  const queueToProcess = [...inMemoryQueue];

  try {
    for (const mutation of queueToProcess) {
      try {
        const synced = await syncItem(mutation);
        if (synced) {
          removePendingMutation(mutation.id);
          successCount++;
        } else {
          // Sync failed or postponed due to quota/offline; stop processing queue
          mutation.retryCount = (mutation.retryCount || 0) + 1;
          saveQueueToStorage(inMemoryQueue);
          break;
        }
      } catch (err) {
        console.warn(`[OfflineManager] Mutation sync failed for ${mutation.id}:`, err);
        mutation.retryCount = (mutation.retryCount || 0) + 1;
        saveQueueToStorage(inMemoryQueue);
        break;
      }
    }
  } finally {
    isSyncing = false;
    notifyListeners();
  }

  return { successCount, remainingCount: inMemoryQueue.length };
}

export function subscribePendingMutations(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function usePendingMutationsCount(): number {
  return useSyncExternalStore(
    subscribePendingMutations,
    getPendingMutationsCount,
    getPendingMutationsCount
  );
}

export function useIsSyncing(): boolean {
  return useSyncExternalStore(
    subscribePendingMutations,
    isCurrentlySyncing,
    isCurrentlySyncing
  );
}
