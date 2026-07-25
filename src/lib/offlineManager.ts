import { TaskInstance } from "../types";

const TASKS_CACHE_PREFIX = "naris_cached_tasks_";
const PENDING_UPDATES_KEY = "naris_pending_updates";
const SCHEMA_VERSION_KEY = "naris_schema_version";

// Current version of our local storage database schema
const CURRENT_SCHEMA_VERSION = 3;

export interface PendingUpdate {
  taskId: string;
  updates: Partial<TaskInstance>;
  timestamp: string;
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// ==========================================
// SCHEMA MIGRATION SYSTEM (نظام ترقية وهيكلة البيانات المحلية)
// ==========================================

interface MigrationFn {
  (data: any): any;
}

const migrations: Record<number, MigrationFn> = {
  // Version 2 Migration: Ensures photo/approval requirements have solid boolean values
  2: (data: any) => {
    if (!data) return data;
    if (Array.isArray(data)) {
      return data.map(task => migrateTaskToV2(task));
    }
    return migrateTaskToV2(data);
  },
  
  // Version 3 Migration: Standardizes status, photo_capture_status, and ISO date formatting
  3: (data: any) => {
    if (!data) return data;
    if (Array.isArray(data)) {
      return data.map(task => migrateTaskToV3(task));
    }
    return migrateTaskToV3(data);
  }
};

function migrateTaskToV2(task: any): any {
  if (!task || typeof task !== "object") return task;
  return {
    ...task,
    requires_photo_before: task.requires_photo_before !== undefined ? task.requires_photo_before : true,
    requires_photo_after: task.requires_photo_after !== undefined ? task.requires_photo_after : true,
    supervisor_approved: task.supervisor_approved !== undefined ? !!task.supervisor_approved : false,
    updated_at: task.updated_at || new Date().toISOString()
  };
}

function migrateTaskToV3(task: any): any {
  if (!task || typeof task !== "object") return task;

  // Normalize photo capture status to avoid any sync mismatch or empty fields
  let photo_capture_status = task.photo_capture_status;
  if (!photo_capture_status) {
    if (task.photo_before_url || task.photo_after_url) {
      photo_capture_status = "uploaded";
    } else {
      photo_capture_status = "pending";
    }
  }

  // Ensure task status is strictly one of the allowed schema values
  const validStatuses = ["pending", "in_progress", "completed", "late", "rejected", "escalated"];
  const status = validStatuses.includes(task.status) ? task.status : "pending";

  // Standardize timestamp formatting to valid ISO-8601 strings
  const normalizeDate = (dStr: any) => {
    if (!dStr) return undefined;
    try {
      const d = new Date(dStr);
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  return {
    ...task,
    status,
    photo_capture_status,
    created_at: task.created_at ? normalizeDate(task.created_at) : new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Automatically executes any pending migrations on localStorage.
 */
export function migrateSchema(): void {
  try {
    const storedVersionStr = localStorage.getItem(SCHEMA_VERSION_KEY);
    let currentStoredVersion = storedVersionStr ? parseInt(storedVersionStr, 10) : 1;

    if (isNaN(currentStoredVersion)) {
      currentStoredVersion = 1;
    }

    if (currentStoredVersion >= CURRENT_SCHEMA_VERSION) {
      console.log(`[Schema Versioning] Local storage is up-to-date (Version ${currentStoredVersion}).`);
      return;
    }

    console.log(`[Schema Versioning] Migrating local storage schema from Version ${currentStoredVersion} to ${CURRENT_SCHEMA_VERSION}...`);

    for (let v = currentStoredVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
      const migrateFn = migrations[v];
      if (!migrateFn) continue;

      // 1. Migrate Pending Updates queue
      const pendingData = localStorage.getItem(PENDING_UPDATES_KEY);
      if (pendingData) {
        try {
          const queue = JSON.parse(pendingData);
          if (Array.isArray(queue)) {
            const migratedQueue = queue.map(item => {
              if (item && item.updates) {
                return {
                  ...item,
                  updates: migrateFn(item.updates)
                };
              }
              return item;
            });
            localStorage.setItem(PENDING_UPDATES_KEY, JSON.stringify(migratedQueue));
            console.log(`[Schema Versioning] Migrated pending updates queue to Version ${v}`);
          }
        } catch (err) {
          console.error(`[Schema Versioning] Failed to migrate pending updates queue to Version ${v}:`, err);
        }
      }

      // 2. Migrate Cached Tasks for all users
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(TASKS_CACHE_PREFIX)) {
          const cachedData = localStorage.getItem(key);
          if (cachedData) {
            try {
              const tasks = JSON.parse(cachedData);
              if (Array.isArray(tasks)) {
                const migratedTasks = migrateFn(tasks);
                localStorage.setItem(key, JSON.stringify(migratedTasks));
                console.log(`[Schema Versioning] Migrated cached tasks for key '${key}' to Version ${v}`);
              }
            } catch (err) {
              console.error(`[Schema Versioning] Failed to migrate cached tasks for key '${key}' to Version ${v}:`, err);
            }
          }
        }
      }
    }

    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
    console.log(`[Schema Versioning] Successfully upgraded local schema version to ${CURRENT_SCHEMA_VERSION}.`);
  } catch (err) {
    console.error("[Schema Versioning] Error during schema migration:", err);
  }
}

// Run schema migration automatically on module load if in browser environment
if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
  migrateSchema();
}

// ==========================================
// LOCAL STORAGE GETTERS & SETTERS
// ==========================================

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
