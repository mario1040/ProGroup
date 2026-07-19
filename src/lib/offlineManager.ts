import { TaskInstance } from "../types";

const TASKS_CACHE_PREFIX = "naris_cached_tasks_";
const PENDING_UPDATES_KEY = "naris_pending_updates";

export interface PendingUpdate {
  taskId: string;
  updates: Partial<TaskInstance>;
  timestamp: string;
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export function saveCachedTasks(userId: string, tasks: any[]): void {
  try {
    localStorage.setItem(`${TASKS_CACHE_PREFIX}${userId}`, JSON.stringify(tasks));
  } catch (err) {
    console.error("Failed to save cached tasks:", err);
  }
}

export function getCachedTasks(userId: string): any[] {
  try {
    const data = localStorage.getItem(`${TASKS_CACHE_PREFIX}${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Failed to get cached tasks:", err);
    return [];
  }
}

export function getPendingUpdates(): PendingUpdate[] {
  try {
    const data = localStorage.getItem(PENDING_UPDATES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Failed to get pending updates:", err);
    return [];
  }
}

export function savePendingUpdates(updates: PendingUpdate[]): void {
  try {
    localStorage.setItem(PENDING_UPDATES_KEY, JSON.stringify(updates));
  } catch (err) {
    console.error("Failed to save pending updates:", err);
  }
}

export function addPendingUpdate(taskId: string, updates: Partial<TaskInstance>): void {
  try {
    const currentQueue = getPendingUpdates();
    const existingIndex = currentQueue.findIndex((item) => item.taskId === taskId);

    if (existingIndex > -1) {
      // Merge updates for the same task to ensure we don't overwrite fields
      currentQueue[existingIndex].updates = {
        ...currentQueue[existingIndex].updates,
        ...updates,
      };
      currentQueue[existingIndex].timestamp = new Date().toISOString();
    } else {
      currentQueue.push({
        taskId,
        updates,
        timestamp: new Date().toISOString(),
      });
    }

    savePendingUpdates(currentQueue);
  } catch (err) {
    console.error("Failed to add pending update:", err);
  }
}

export function removePendingUpdate(taskId: string): void {
  try {
    const currentQueue = getPendingUpdates();
    const filtered = currentQueue.filter((item) => item.taskId !== taskId);
    savePendingUpdates(filtered);
  } catch (err) {
    console.error("Failed to remove pending update:", err);
  }
}

export function clearAllPendingUpdates(): void {
  try {
    localStorage.removeItem(PENDING_UPDATES_KEY);
  } catch (err) {
    console.error("Failed to clear pending updates:", err);
  }
}
