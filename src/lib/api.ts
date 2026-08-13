import { Profile, Zone, TaskTemplate, SOPItem, TaskInstance, OperationalTask, DeviceSwitch } from "../types";
import { 
  db, 
  auth, 
  storage, 
  OperationType, 
  handleFirestoreError,
  firebaseConfig
} from "./firebase";
import { 
  doc as firebaseDoc, 
  getDoc as firebaseGetDoc, 
  getDocs as firebaseGetDocs, 
  setDoc as firebaseSetDoc, 
  deleteDoc as firebaseDeleteDoc, 
  updateDoc as firebaseUpdateDoc,
  collection as firebaseCollection, 
  query as firebaseQuery, 
  where as firebaseWhere,
  onSnapshot as firebaseOnSnapshot
} from "firebase/firestore";
import { 
  ref as storageRef, 
  uploadString, 
  getDownloadURL,
  uploadBytesResumable,
  UploadTask,
  deleteObject
} from "firebase/storage";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  getAuth
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { getSeededDB } from "../db_default";
import { 
  isOnline, 
  saveCachedTasks, 
  getCachedTasks, 
  addPendingUpdate, 
  getPendingUpdates, 
  removePendingUpdate,
  pruneStorageData
} from "./offlineManager";

// 44--- Clean Undefined Interceptor (Mandatory to prevent Firestore crash) ---
function cleanUndefined<T extends object>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;
  const result = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val === undefined) {
      (result as any)[key] = null; // Convert undefined to null to prevent any Firestore crash
    } else if (val && typeof val === "object" && !(val instanceof Date)) {
      (result as any)[key] = cleanUndefined(val);
    } else {
      (result as any)[key] = val;
    }
  }
  return result as T;
}

// --- Local Fallback Database Engine ---
let localDBInitialized = false;

// Automatically reset local fallback if switching to a new Firebase project ID
const currentProjectId = firebaseConfig.projectId;
try {
  const lastUsedProjectId = localStorage.getItem("last_used_project_id");
  if (lastUsedProjectId && lastUsedProjectId !== currentProjectId) {
    console.log("[Project Change Detected] Resetting local caches, database and forcing sign-out...");
    localStorage.setItem("last_used_project_id", currentProjectId);
    localStorage.removeItem("use_local_fallback");
    localStorage.removeItem("narisops_local_db");
    localStorage.removeItem("naris_ops_session");
    localStorage.removeItem("naris_ops_user");
    localStorage.removeItem("naris_pending_updates");
    localStorage.removeItem("naris_schema_version");
    localStorage.removeItem("naris_inventory_data");
    localStorage.removeItem("use_base64_storage");
    
    // Clear other keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("naris_") || key.startsWith("narisops_"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    setTimeout(() => {
      window.dispatchEvent(new Event("project_changed_sign_out"));
    }, 100);
  } else if (!lastUsedProjectId) {
    localStorage.setItem("last_used_project_id", currentProjectId);
  }
} catch (e) {
  console.warn("localStorage is not accessible during project check:", e);
}

let useLocalFallback = localStorage.getItem("use_local_fallback") === "true";

// --- Memory Cache for Metadata to Reduce Firestore Reads ---
let cachedProfiles: Profile[] | null = null;
let cachedTemplates: TaskTemplate[] | null = null;
let cachedSopItems: SOPItem[] | null = null;
let cachedZones: Zone[] | null = null;
let cachedOperationalTasks: any[] | null = null;
let cachedDeviceSwitches: DeviceSwitch[] | null = null;

export function invalidateMetadataCaches() {
  cachedProfiles = null;
  cachedTemplates = null;
  cachedSopItems = null;
  cachedZones = null;
  cachedOperationalTasks = null;
  cachedDeviceSwitches = null;
}

export function forceClearAllCaches() {
  try {
    localStorage.removeItem("naris_ops_session");
    localStorage.removeItem("naris_ops_user");
    localStorage.removeItem("narisops_local_db");
    localStorage.removeItem("use_local_fallback");
    localStorage.removeItem("naris_pending_updates");
    localStorage.removeItem("naris_schema_version");
    localStorage.removeItem("naris_inventory_data");
    localStorage.removeItem("use_base64_storage");
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("naris_") || key.startsWith("narisops_"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    invalidateMetadataCaches();
    
    // Reset local DB in memory
    localDB.users = {};
    localDB.locations = {};
    localDB.zones = {};
    localDB.task_templates = {};
    localDB.sop_items = {};
    localDB.task_instances = {};
    localDB.operational_tasks = {};
    localDB.notifications = {};
    localDB.device_switches = {};
    localDB.kpi_snapshots = {};
    
    localDBInitialized = false;
    useLocalFallback = false;
    
    window.dispatchEvent(new Event("local_fallback_changed"));
    window.dispatchEvent(new Event("project_changed_sign_out"));
    
    console.log("[Cache Cleared] Successfully wiped out all cached data and forced logout.");
  } catch (err) {
    console.error("Error forcing complete clearing of caches:", err);
  }
}

let localDB: {
  users: Record<string, any>;
  locations: Record<string, any>;
  zones: Record<string, any>;
  task_templates: Record<string, any>;
  sop_items: Record<string, any>;
  task_instances: Record<string, any>;
  operational_tasks: Record<string, any>;
  notifications: Record<string, any>;
  device_switches: Record<string, any>;
  kpi_snapshots: Record<string, any>;
} = {
  users: {},
  locations: {},
  zones: {},
  task_templates: {},
  sop_items: {},
  task_instances: {},
  operational_tasks: {},
  notifications: {},
  device_switches: {},
  kpi_snapshots: {}
};

function initLocalDB() {
  if (localDBInitialized) return;
  
  try {
    const stored = localStorage.getItem("narisops_local_db");
    if (stored) {
      localDB = JSON.parse(stored);
      // Ensure all collections exist
      const keys: (keyof typeof localDB)[] = ["users", "locations", "zones", "task_templates", "sop_items", "task_instances", "operational_tasks", "notifications", "device_switches", "kpi_snapshots"];
      keys.forEach(k => {
        if (!localDB[k]) localDB[k] = {};
      });

      // Clear out the old default templates and their instances if they are present in localStorage to prevent them syncing back
      // But KEEP the new templates that are defined in our seeded DB!
      let localTemplatesChanged = false;
      const seeded = getSeededDB();
      const validTemplateIds = new Set(seeded.task_templates.map(t => t.id));
      
      const tKeys = Object.keys(localDB.task_templates);
      for (const tk of tKeys) {
        if (tk.startsWith("t_sop_") && !validTemplateIds.has(tk)) {
          delete localDB.task_templates[tk];
          localTemplatesChanged = true;
        }
      }
      
      const tiKeys = Object.keys(localDB.task_instances);
      for (const tik of tiKeys) {
        const ti = localDB.task_instances[tik];
        if (ti && ti.template_id && ti.template_id.startsWith("t_sop_") && !validTemplateIds.has(ti.template_id)) {
          delete localDB.task_instances[tik];
          localTemplatesChanged = true;
        }
      }

      // Ensure all valid seeded templates are present in localDB.task_templates & localDB.sop_items
      seeded.task_templates.forEach(t => {
        if (!localDB.task_templates[t.id]) {
          localDB.task_templates[t.id] = t;
          localTemplatesChanged = true;
        }
        if (!localDB.sop_items[t.id]) {
          localDB.sop_items[t.id] = t;
          localTemplatesChanged = true;
        }
      });

      // Migrate existing local templates to sop_items if empty
      if (!localDB.sop_items || Object.keys(localDB.sop_items).length === 0) {
        localDB.sop_items = {};
        Object.keys(localDB.task_templates).forEach(k => {
          localDB.sop_items[k] = localDB.task_templates[k];
        });
        localTemplatesChanged = true;
      }

      // Auto-recovery for deactivated admin accounts in local storage fallback
      let localUsersChanged = false;
      if (localDB.users) {
        Object.keys(localDB.users).forEach((uid) => {
          const userObj = localDB.users[uid];
          if (userObj && userObj.role === "admin") {
            if (userObj.is_active === false) {
              console.log(`[Auto-Recovery] Reactivating local admin account: ${uid}`);
              userObj.is_active = true;
              localUsersChanged = true;
            }
            if (userObj.username === "admin" && userObj.password !== "admin123" && !userObj.password?.endsWith("admin123")) {
              console.log(`[Auto-Recovery] Resetting local admin password to admin123`);
              userObj.password = "admin123";
              localUsersChanged = true;
            }
          }
        });
      }
      
      if (localTemplatesChanged || localUsersChanged) {
        console.log("[Local DB] Auto-purged old/obsolete templates and/or recovered locked out admin accounts.");
        try {
          localStorage.setItem("narisops_local_db", JSON.stringify(localDB));
        } catch (e) {
          console.error("[Local DB] Failed to save updated localDB after refresh", e);
        }
      }

      localDBInitialized = true;
      console.log("[Local DB] Loaded existing database from localStorage");
      return;
    }
  } catch (e) {
    console.warn("[Local DB] Failed to load from localStorage, using memory", e);
  }

  console.log("[Local DB] No local database found. Seeding initial local database...");
  const seeded = getSeededDB();
  
  seeded.profiles.forEach(p => { localDB.users[p.id] = p; });
  seeded.locations.forEach(l => { localDB.locations[l.id] = l; });
  seeded.zones.forEach(z => { localDB.zones[z.id] = z; });
  seeded.task_templates.forEach(t => { 
    localDB.task_templates[t.id] = t; 
    localDB.sop_items[t.id] = t;
  });
  seeded.task_instances.forEach(ti => { localDB.task_instances[ti.id] = ti; });
  seeded.operational_tasks.forEach(ot => { localDB.operational_tasks[ot.id] = ot; });
  seeded.notifications.forEach(n => { localDB.notifications[n.id] = n; });
  seeded.device_switches.forEach(sw => { localDB.device_switches[sw.id] = sw; });
  seeded.kpi_snapshots.forEach(k => { localDB.kpi_snapshots[k.id] = k; });

  saveLocalDB();
  localDBInitialized = true;
}

function pruneLocalDBInstances(): boolean {
  if (!localDB || !localDB.task_instances) return false;
  
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0]; // YYYY-MM-DD

  const pendingUpdates = getPendingUpdates();
  const pendingTaskIds = new Set(pendingUpdates.map(item => item.taskId));
  
  let changed = false;
  const ids = Object.keys(localDB.task_instances);
  for (const id of ids) {
    const task = localDB.task_instances[id];
    if (!task) continue;

    // Remove base64 strings if the task has already been synced (not in pending queue)
    if (!pendingTaskIds.has(id)) {
      if (task.photo_before_url && task.photo_before_url.startsWith("data:")) {
        task.photo_before_url = "";
        changed = true;
      }
      if (task.photo_after_url && task.photo_after_url.startsWith("data:")) {
        task.photo_after_url = "";
        changed = true;
      }
    }

    // Strip base64 guide/reference images from task instances (they will fall back to template)
    if (task.guide_image_url && task.guide_image_url.startsWith("data:")) {
      task.guide_image_url = "";
      changed = true;
    }
    if (task.reference_image_url && task.reference_image_url.startsWith("data:")) {
      task.reference_image_url = "";
      changed = true;
    }

    // Prune completed/approved/rejected tasks older than 2 days
    if (task.status === "completed" || task.status === "supervisor_approved" || task.status === "rejected") {
      if (pendingTaskIds.has(id)) continue; // Never delete pending updates!
      if (task.due_date && task.due_date < twoDaysAgoStr) {
        delete localDB.task_instances[id];
        changed = true;
      }
    }
  }

  // Limit total number of completed task instances in localDB
  const remainingIds = Object.keys(localDB.task_instances);
  const completedTasks = remainingIds
    .map(id => localDB.task_instances[id])
    .filter(t => t && (t.status === "completed" || t.status === "supervisor_approved" || t.status === "rejected") && !pendingTaskIds.has(t.id));

  if (completedTasks.length > 50) {
    completedTasks.sort((a, b) => (b.due_date || "").localeCompare(a.due_date || ""));
    const toDelete = completedTasks.slice(50);
    for (const t of toDelete) {
      delete localDB.task_instances[t.id];
      changed = true;
    }
  }

  return changed;
}

function saveLocalDB() {
  try {
    pruneLocalDBInstances();
    localStorage.setItem("narisops_local_db", JSON.stringify(localDB));
    if (localDB && localDB.zones) {
      Object.keys(localDB.zones).forEach(zId => {
        const zone = localDB.zones[zId];
        if (zone && zone.cover_image_url) {
          if (!zone.cover_image_url.startsWith("data:") || zone.cover_image_url.length < 50000) {
            localStorage.setItem(`naris_zone_image_${zId}`, zone.cover_image_url);
          }
        }
      });
    }
  } catch (e: any) {
    console.warn("[Local DB] First setItem failed (potential quota limit). Attempting aggressive prune...", e);
    try {
      pruneStorageData();
      
      // Even more aggressive localDB prune: strip ALL base64 images from completed tasks
      if (localDB && localDB.task_instances) {
        Object.keys(localDB.task_instances).forEach(id => {
          const t = localDB.task_instances[id];
          if (t && (t.status === "completed" || t.status === "supervisor_approved" || t.status === "rejected")) {
            if (t.photo_before_url && t.photo_before_url.startsWith("data:")) {
              t.photo_before_url = "";
            }
            if (t.photo_after_url && t.photo_after_url.startsWith("data:")) {
              t.photo_after_url = "";
            }
          }
        });
      }
      
      localStorage.setItem("narisops_local_db", JSON.stringify(localDB));
      console.log("[Local DB] Saved successfully after aggressive pruning.");
    } catch (err) {
      console.error("[Local DB] Critical: Failed to save even after aggressive pruning:", err);
    }
  }
}

function triggerLocalFallback(error: any) {
  if (!useLocalFallback) {
    console.warn("[Local Fallback Triggered] Switching database operations to local storage due to Firestore failure:", error);
    useLocalFallback = true;
    try {
      localStorage.setItem("use_local_fallback", "true");
    } catch (e) {}
    // Dispatch custom event to notify React components to update their UI immediately
    window.dispatchEvent(new Event("local_fallback_changed"));
  }
}

export function isUsingLocalFallback(): boolean {
  return useLocalFallback;
}

export function setLocalFallback(value: boolean) {
  useLocalFallback = value;
  try {
    localStorage.setItem("use_local_fallback", value ? "true" : "false");
  } catch (e) {}
  window.dispatchEvent(new Event("local_fallback_changed"));
}

const snapshotListeners = new Set<{
  query: any;
  callback: (snap: any) => void;
  errorCallback?: (err: any) => void;
}>();

function triggerSnapshotListeners(collectionName: string) {
  for (const listener of snapshotListeners) {
    const colName = listener.query.__collection_path;
    if (colName === collectionName) {
      const docs = Object.values(localDB[colName as keyof typeof localDB] || {});
      const filtered = localFilter(docs, listener.query.__constraints || []);
      const fakeSnap = {
        empty: filtered.length === 0,
        docs: filtered.map(item => ({
          id: item.id,
          data: () => item
        })),
        forEach: (cb: any) => {
          filtered.forEach((item) => {
            cb({
              id: item.id,
              data: () => item
            });
          });
        }
      };
      listener.callback(fakeSnap as any);
    }
  }
}

function localFilter(items: any[], constraints: any[]): any[] {
  let filtered = [...items];
  for (const c of constraints) {
    if (c && c.__isWhere) {
      const { field, op, value } = c.metadata;
      filtered = filtered.filter(item => {
        if (!item) return false;
        const itemVal = item[field];
        if (op === "==") {
          return itemVal === value;
        } else if (op === "!=") {
          return itemVal !== value;
        } else if (op === ">") {
          return itemVal > value;
        } else if (op === "<") {
          return itemVal < value;
        } else if (op === ">=") {
          return itemVal >= value;
        } else if (op === "<=") {
          return itemVal <= value;
        } else if (op === "array-contains") {
          return Array.isArray(itemVal) && itemVal.includes(value);
        }
        return true;
      });
    }
  }
  return filtered;
}

// --- Custom Wrapped Firestore API Layer ---

export function collection(dbInstance: any, path: string): any {
  const targetDb = dbInstance || db;
  if (!targetDb) {
    console.error(`[collection] Both dbInstance and imported db are undefined for path: ${path}`);
  }
  const colRef = firebaseCollection(targetDb, path) as any;
  try {
    colRef.__collection_path = path;
  } catch (e) {
    console.warn("Could not set __collection_path on colRef", e);
  }
  return colRef;
}

export function query(colRef: any, ...constraints: any[]): any {
  const realConstraints = constraints.map(c => (c && c.__isWhere) ? c.realConstraint : c);
  const queryRef = firebaseQuery(colRef, ...realConstraints) as any;
  try {
    queryRef.__collection_path = colRef.__collection_path || colRef.path || "";
    queryRef.__constraints = constraints;
  } catch (e) {
    console.warn("Could not set custom properties on queryRef", e);
  }
  return queryRef;
}

export function where(field: string, op: string, value: any): any {
  const realConstraint = firebaseWhere(field, op as any, value);
  return {
    realConstraint,
    metadata: { field, op, value },
    __isWhere: true
  };
}

export function doc(...args: any[]): any {
  const [first, second, third] = args;
  let colPath = "";
  let docId = "";
  if (typeof first === "string") {
    colPath = first;
    docId = second;
  } else if (first && first.__collection_path) {
    colPath = first.__collection_path;
    docId = second;
  } else {
    colPath = second;
    docId = third;
  }
  
  const firstArg = typeof first === "string" ? first : (first || db);
  if (!firstArg) {
    console.error(`[doc] Both first argument and imported db are undefined for path: ${colPath || second}`);
  }
  const realDocRef = firebaseDoc(firstArg, args[1], ...args.slice(2)) as any;
  try {
    realDocRef.__isDocRef = true;
    realDocRef.__collection_path = colPath;
    realDocRef.__doc_id = docId;
  } catch (e) {
    console.warn("Could not set custom properties on realDocRef", e);
  }
  return realDocRef;
}

export async function getDoc(docRef: any): Promise<any> {
  if (useLocalFallback) {
    initLocalDB();
    const colName = docRef.__collection_path || docRef.path?.split("/")[0] || "";
    const docId = docRef.__doc_id || docRef.id || "";
    const data = localDB[colName as keyof typeof localDB]?.[docId];
    return {
      exists: () => !!data,
      data: () => data,
      id: docId
    };
  }
  try {
    const snap = await firebaseGetDoc(docRef);
    return snap;
  } catch (err: any) {
    triggerLocalFallback(err);
    initLocalDB();
    const colName = docRef.__collection_path || docRef.path?.split("/")[0] || "";
    const docId = docRef.__doc_id || docRef.id || "";
    const data = localDB[colName as keyof typeof localDB]?.[docId];
    return {
      exists: () => !!data,
      data: () => data,
      id: docId
    };
  }
}

export async function getDocs(q: any): Promise<any> {
  if (useLocalFallback) {
    initLocalDB();
    const colName = q.__collection_path || (typeof q.path === "string" ? q.path : "");
    const docs = Object.values(localDB[colName as keyof typeof localDB] || {});
    const filtered = localFilter(docs, q.__constraints || []);
    return {
      empty: filtered.length === 0,
      size: filtered.length,
      docs: filtered.map(item => ({
        id: item.id,
        data: () => item
      })),
      forEach: (cb: any) => {
        filtered.forEach(item => {
          cb({
            id: item.id,
            data: () => item
          });
        });
      }
    };
  }
  try {
    const snap = await firebaseGetDocs(q);
    return snap;
  } catch (err: any) {
    triggerLocalFallback(err);
    initLocalDB();
    const colName = q.__collection_path || (typeof q.path === "string" ? q.path : "");
    const docs = Object.values(localDB[colName as keyof typeof localDB] || {});
    const filtered = localFilter(docs, q.__constraints || []);
    return {
      empty: filtered.length === 0,
      size: filtered.length,
      docs: filtered.map(item => ({
        id: item.id,
        data: () => item
      })),
      forEach: (cb: any) => {
        filtered.forEach(item => {
          cb({
            id: item.id,
            data: () => item
          });
        });
      }
    };
  }
}

export function syncTaskAcrossCaches(task: any) {
  if (typeof localStorage === "undefined") return;
  if (!task || !task.id) return;

  const id = task.id;
  const newUserId = task.assigned_to;

  const prefix = "naris_cached_tasks_";
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const userId = key.replace(prefix, "");
      if (userId === "all") {
        const tasks = getCachedTasks("all");
        const exists = tasks.some(t => t.id === id);
        const updated = exists ? tasks.map(t => t.id === id ? { ...t, ...task } : t) : [...tasks, task];
        saveCachedTasks("all", updated);
      } else if (newUserId && userId === newUserId) {
        const tasks = getCachedTasks(newUserId);
        const exists = tasks.some(t => t.id === id);
        const updated = exists ? tasks.map(t => t.id === id ? { ...t, ...task } : t) : [...tasks, task];
        saveCachedTasks(newUserId, updated);
      } else {
        const tasks = getCachedTasks(userId);
        const exists = tasks.some(t => t.id === id);
        if (exists) {
          const updated = tasks.filter(t => t.id !== id);
          saveCachedTasks(userId, updated);
        }
      }
    }
  }
}

export async function setDoc(docRef: any, data: any, options?: any) {
  const cleaned = cleanUndefined(data);
  const colName = docRef.__collection_path || docRef.path?.split("/")[0] || "";
  const docId = docRef.__doc_id || docRef.id || "";

  // Always keep local database up to date to prevent syncing old or deleted data back
  try {
    initLocalDB();
    if (colName && docId) {
      if (options?.merge && localDB[colName as keyof typeof localDB]?.[docId]) {
        localDB[colName as keyof typeof localDB][docId] = {
          ...localDB[colName as keyof typeof localDB][docId],
          ...cleaned
        };
      } else {
        localDB[colName as keyof typeof localDB][docId] = cleaned;
      }
      saveLocalDB();
    }
  } catch (e) {
    console.warn("[Local DB] Failed to sync setDoc to local storage:", e);
  }

  // Synchronize local cached tasks lists
  if (colName === "task_instances" && docId) {
    try {
      const fullTask = localDB.task_instances[docId];
      if (fullTask) {
        syncTaskAcrossCaches(fullTask);
      }
    } catch (e) {
      console.warn("Failed to sync task cache inside setDoc:", e);
    }
  }

  if (useLocalFallback) {
    triggerSnapshotListeners(colName);
    return;
  }
  try {
    await firebaseSetDoc(docRef, cleaned, options);
  } catch (err: any) {
    triggerLocalFallback(err);
    triggerSnapshotListeners(colName);
  }
}

export async function updateDoc(docRef: any, data: any) {
  const cleaned = cleanUndefined(data);
  const colName = docRef.__collection_path || docRef.path?.split("/")[0] || "";
  const docId = docRef.__doc_id || docRef.id || "";

  // Always keep local database up to date to prevent syncing old or deleted data back
  try {
    initLocalDB();
    if (colName && docId) {
      localDB[colName as keyof typeof localDB][docId] = {
        ...(localDB[colName as keyof typeof localDB][docId] || {}),
        ...cleaned
      };
      saveLocalDB();
    }
  } catch (e) {
    console.warn("[Local DB] Failed to sync updateDoc to local storage:", e);
  }

  // Synchronize local cached tasks lists
  if (colName === "task_instances" && docId) {
    try {
      const fullTask = localDB.task_instances[docId];
      if (fullTask) {
        syncTaskAcrossCaches(fullTask);
      }
    } catch (e) {
      console.warn("Failed to sync task cache inside updateDoc:", e);
    }
  }

  if (useLocalFallback) {
    triggerSnapshotListeners(colName);
    return;
  }
  try {
    await firebaseUpdateDoc(docRef, cleaned);
  } catch (err: any) {
    triggerLocalFallback(err);
    triggerSnapshotListeners(colName);
  }
}

export async function deleteDoc(docRef: any) {
  const colName = docRef.__collection_path || docRef.path?.split("/")[0] || "";
  const docId = docRef.__doc_id || docRef.id || "";

  // Always keep local database up to date to prevent syncing old or deleted data back
  try {
    initLocalDB();
    if (colName && docId) {
      if (localDB[colName as keyof typeof localDB]) {
        delete localDB[colName as keyof typeof localDB][docId];
      }
      saveLocalDB();
    }
  } catch (e) {
    console.warn("[Local DB] Failed to sync deleteDoc to local storage:", e);
  }

  if (useLocalFallback) {
    triggerSnapshotListeners(colName);
    return;
  }
  try {
    await firebaseDeleteDoc(docRef);
  } catch (err: any) {
    triggerLocalFallback(err);
    triggerSnapshotListeners(colName);
  }
}

export function onSnapshot(q: any, callback: any, errorCallback?: any): any {
  if (useLocalFallback) {
    initLocalDB();
    const listenerObj = { query: q, callback, errorCallback };
    snapshotListeners.add(listenerObj);
    
    const colName = q.__collection_path;
    const docs = Object.values(localDB[colName as keyof typeof localDB] || {});
    const filtered = localFilter(docs, q.__constraints || []);
    const fakeSnap = {
      empty: filtered.length === 0,
      size: filtered.length,
      docs: filtered.map(item => ({
        id: item.id,
        data: () => item
      })),
      forEach: (cb: any) => {
        filtered.forEach((item) => {
          cb({
            id: item.id,
            data: () => item
          });
        });
      }
    };
    setTimeout(() => {
      callback(fakeSnap);
    }, 0);

    return () => {
      snapshotListeners.delete(listenerObj);
    };
  } else {
    try {
      const realUnsubscribe = firebaseOnSnapshot(q, callback, (err) => {
        if (err.message && (err.message.toLowerCase().includes("quota") || err.message.toLowerCase().includes("permission") || err.message.toLowerCase().includes("exceeded"))) {
          triggerLocalFallback(err);
          const localUnsub = onSnapshot(q, callback, errorCallback);
          return localUnsub;
        }
        if (errorCallback) errorCallback(err);
      });
      return realUnsubscribe;
    } catch (err: any) {
      triggerLocalFallback(err);
      return onSnapshot(q, callback, errorCallback);
    }
  }
}

let seedingPromise: Promise<void> | null = null;

export function clearSeedingPromise() {
  seedingPromise = null;
}

let deduplicationPromise: Promise<void> | null = null;

export async function deduplicateDatabase(): Promise<void> {
  if (deduplicationPromise) {
    return deduplicationPromise;
  }

  deduplicationPromise = (async () => {
    console.log("[Firestore Client] Running deduplication for task_templates, sop_items and task_instances...");
    try {
      // 1. Deduplicate task_templates & sop_items
      const templatesCol = collection(db, "task_templates");
      const templatesSnap = await getDocs(templatesCol);
      const seenTemplates = new Map<string, string>(); // Key: title + "_" + zone_id, Value: kept_template_id
      
      for (const docSnap of templatesSnap.docs) {
        const data = docSnap.data();
        const title = (data.title || "").trim();
        const zoneId = data.zone_id || "";
        const key = `${title}_${zoneId}`;
        
        if (seenTemplates.has(key)) {
          // This is a duplicate template! Delete it.
          console.log(`[Deduplicator] Deleting duplicate task_template: ${data.title} (${docSnap.id})`);
          try {
            await deleteDoc(doc(db, "task_templates", docSnap.id));
            await deleteDoc(doc(db, "sop_items", docSnap.id));
          } catch (e) {
            console.error(`[Deduplicator] Failed to delete duplicate template ${docSnap.id}`, e);
          }
        } else {
          seenTemplates.set(key, docSnap.id);
        }
      }

      // 1b. Deduplicate sop_items specifically if they diverged
      const sopCol = collection(db, "sop_items");
      const sopSnap = await getDocs(sopCol);
      const seenSop = new Map<string, string>();
      for (const docSnap of sopSnap.docs) {
        const data = docSnap.data();
        const title = (data.title || "").trim();
        const zoneId = data.zone_id || "";
        const key = `${title}_${zoneId}`;
        
        if (seenSop.has(key)) {
          console.log(`[Deduplicator] Deleting duplicate sop_item: ${data.title} (${docSnap.id})`);
          try {
            await deleteDoc(doc(db, "sop_items", docSnap.id));
            await deleteDoc(doc(db, "task_templates", docSnap.id));
          } catch (e) {
            console.error(`[Deduplicator] Failed to delete duplicate sop_item ${docSnap.id}`, e);
          }
        } else {
          seenSop.set(key, docSnap.id);
        }
      }

      // 2. Deduplicate task_instances
      const instancesCol = collection(db, "task_instances");
      const instancesSnap = await getDocs(instancesCol);
      const seenInstances = new Set<string>(); // Key: title + "_" + zone_id + "_" + due_date
      
      for (const docSnap of instancesSnap.docs) {
        const data = docSnap.data();
        const title = (data.title || "").trim();
        const zoneId = data.zone_id || "";
        const dueDate = data.due_date || "";
        const key = `${title}_${zoneId}_${dueDate}`;
        
        if (seenInstances.has(key)) {
          // This is a duplicate task instance! Delete it.
          console.log(`[Deduplicator] Deleting duplicate task_instance: ${data.title} for ${dueDate} (${docSnap.id})`);
          try {
            await deleteDoc(doc(db, "task_instances", docSnap.id));
          } catch (e) {
            console.error(`[Deduplicator] Failed to delete duplicate instance ${docSnap.id}`, e);
          }
        } else {
          seenInstances.add(key);
        }
      }
      console.log("[Firestore Client] Deduplication completed successfully.");
    } catch (err) {
      console.error("[Firestore Client] Deduplication failed:", err);
    }
  })();

  return deduplicationPromise;
}

/**
 * Migrates local storage database to the remote Firestore database, clearing any defaults first to prevent duplicates.
 */
export async function syncLocalDatabaseToFirestore(): Promise<void> {
  let localDbData: any = null;
  try {
    const stored = localStorage.getItem("narisops_local_db");
    if (stored) {
      localDbData = JSON.parse(stored);
    }
  } catch (e) {
    console.warn("[Sync Engine] Failed to parse local database:", e);
    throw new Error("فشل قراءة قاعدة البيانات المحلية من المستعرض.");
  }

  const hasCustomLocalData = localDbData && (
    (localDbData.task_templates && Object.keys(localDbData.task_templates).length > 0) || 
    (localDbData.task_instances && Object.keys(localDbData.task_instances).length > 0)
  );

  if (!hasCustomLocalData) {
    throw new Error("لا توجد بيانات مهام أو بنود مخزنة محلياً على هذا الجهاز لنقلها.");
  }

  console.log(`[Sync Engine] Initializing database migration to project: ${currentProjectId}`);
  
  const colNames = [
    "locations",
    "zones",
    "task_templates",
    "sop_items",
    "task_instances",
    "operational_tasks",
    "notifications",
    "device_switches",
    "kpi_snapshots"
  ];

  // If localDbData.sop_items is missing/empty, populate from task_templates to preserve historical local templates
  if (localDbData && (!localDbData.sop_items || Object.keys(localDbData.sop_items).length === 0)) {
    localDbData.sop_items = localDbData.task_templates || {};
  }

  // 1. Clear existing documents in Firestore to prevent duplicates
  for (const colName of colNames) {
    try {
      const colSnap = await getDocs(collection(db, colName));
      for (const docSnap of colSnap.docs) {
        await deleteDoc(doc(db, colName, docSnap.id));
      }
      console.log(`[Sync Engine] Cleared Firestore collection: ${colName}`);
    } catch (e) {
      console.warn(`[Sync Engine] Failed to clear collection ${colName}:`, e);
    }
  }

  // 2. Clear users
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    for (const docSnap of usersSnap.docs) {
      await deleteDoc(doc(db, "users", docSnap.id));
    }
  } catch (e) {
    console.warn("[Sync Engine] Failed to clear users:", e);
  }

  // 3. Seed users
  const seeded = getSeededDB();
  const usersMap: Record<string, any> = {};
  for (const p of seeded.profiles) {
    usersMap[p.id] = p;
  }
  if (localDbData.users) {
    for (const uid of Object.keys(localDbData.users)) {
      usersMap[uid] = localDbData.users[uid];
    }
  }
  for (const pId of Object.keys(usersMap)) {
    const profileToSeed = {
      ...usersMap[pId],
      password: await normalizePasswordRecord(usersMap[pId].password, usersMap[pId].username === "admin" ? "admin123" : "123456")
    };
    await setDoc(doc(db, "users", pId), profileToSeed);
  }

  // 4. Upload each other collection
  for (const colName of colNames) {
    const localItems = localDbData[colName] || {};
    const localKeys = Object.keys(localItems);
    
    if (localKeys.length > 0) {
      console.log(`[Sync Engine] Uploading ${localKeys.length} items from local database for collection: ${colName}`);
      for (const key of localKeys) {
        await setDoc(doc(db, colName, key), localItems[key]);
      }
    } else {
      const defaultList = (seeded as any)[colName] || [];
      console.log(`[Sync Engine] Local collection ${colName} is empty. Seeding default ${defaultList.length} items.`);
      for (const item of defaultList) {
        await setDoc(doc(db, colName, item.id), item);
      }
    }
  }

  localStorage.setItem("naris_local_db_synced_to_firestore", currentProjectId);
  invalidateMetadataCaches();
  console.log("[Sync Engine] Synchronization completed successfully.");
}

/**
 * Ensures Firestore is properly seeded with initial data if it's completely empty.
 */
async function ensureSeeded(): Promise<void> {
  if (useLocalFallback) {
    return;
  }
  if (seedingPromise) {
    return seedingPromise;
  }
  
  seedingPromise = (async () => {
    try {
      // 1. Check if we need to do automatic migration/sync of local database first
      let localDbData: any = null;
      try {
        const stored = localStorage.getItem("narisops_local_db");
        if (stored) {
          localDbData = JSON.parse(stored);
        }
      } catch (e) {
        console.warn("[Firestore Client] Failed to parse local database during sync check:", e);
      }

      const hasCustomLocalData = localDbData && (
        (localDbData.task_templates && Object.keys(localDbData.task_templates).length > 0) || 
        (localDbData.task_instances && Object.keys(localDbData.task_instances).length > 0)
      );

      const syncFlag = localStorage.getItem("naris_local_db_synced_to_firestore");
      if (hasCustomLocalData && syncFlag !== currentProjectId) {
        console.log(`[Sync Engine] Automatic synchronization detected. Migrating local database to ${currentProjectId}...`);
        await syncLocalDatabaseToFirestore();
        return;
      }

      // Check if users collection already has data
      const usersCol = collection(db, "users");
      let usersSnap;
      try {
        usersSnap = await getDocs(usersCol);
      } catch (err: any) {
        if (err.code === "permission-denied" || (err.message && err.message.toLowerCase().includes("permission"))) {
          console.warn("[Firestore Client] Seeding check skipped due to missing permissions (unauthenticated). Seeding will be deferred until authentication is complete.");
          seedingPromise = null; // Reset so we can try again once authenticated
          return;
        }
        throw err;
      }

      // Ensure the default SOP templates are seeded ONLY if the task_templates collection is completely empty in Firestore
      const templatesCol = collection(db, "task_templates");
      const templatesSnap = await getDocs(templatesCol);
      if (templatesSnap.empty && !useLocalFallback) {
        console.log("[SOP Template Engine] Firestore task_templates is empty. Seeding 34 default SOP templates...");
        try {
          const seededTemplates = getSeededDB().task_templates;
          for (const template of seededTemplates) {
            await setDoc(doc(db, "task_templates", template.id), template);
            console.log(`[SOP Template Engine] Seeded template: ${template.id}`);
          }
          const syncFlagKey = "naris_sop_templates_synced_v34_fix";
          localStorage.setItem(syncFlagKey, "true");
          invalidateMetadataCaches();
        } catch (error) {
          console.error("[SOP Template Engine] Failed to seed SOP templates:", error);
        }
      }

      if (!usersSnap.empty) {
        await deduplicateDatabase();

        // Auto-reactivate any deactivated admin accounts and reset admin passwords to admin123 to recover from accidental lockouts
        try {
          const reactivatePromises = usersSnap.docs
            .map(async docSnap => {
              const userData = docSnap.data();
              let changed = false;
              const updatedData = { ...userData };

              if (userData && userData.role === "admin") {
                if (userData.is_active === false) {
                  console.log(`[Auto-Recovery] Reactivating admin account ${docSnap.id}...`);
                  updatedData.is_active = true;
                  changed = true;
                }

                if (userData.username === "admin") {
                  const targetHash = await createPasswordRecord("admin123");
                  if (userData.password !== targetHash) {
                    console.log(`[Auto-Recovery] Resetting password for admin account ${docSnap.id} to admin123...`);
                    updatedData.password = targetHash;
                    changed = true;
                  }
                }
              }

              if (changed) {
                const userRef = doc(db, "users", docSnap.id);
                await setDoc(userRef, updatedData);
                return true;
              }
              return null;
            });

          const results = await Promise.all(reactivatePromises);
          if (results.some(Boolean)) {
            invalidateMetadataCaches();
          }
        } catch (e) {
          console.warn("[Auto-Recovery] Failed to auto-reactivate admin accounts:", e);
        }

        // AUTO-HEALING: If database has users but other critical collections are empty, seed them!
        try {
          const locationsSnap = await getDocs(collection(db, "locations"));
          if (locationsSnap.empty) {
            console.log("[Firestore Client] Auto-healing: Locations collection is empty. Seeding defaults...");
            const seeded = getSeededDB();
            for (const l of seeded.locations) {
              await setDoc(doc(db, "locations", l.id), l);
            }
          }
        } catch (e) {
          console.warn("[Firestore Client] Auto-healing: Failed to check/seed locations:", e);
        }

        try {
          const zonesSnap = await getDocs(collection(db, "zones"));
          const seeded = getSeededDB();
          const existingZoneIds = new Set<string>();
          zonesSnap.forEach((docSnap) => {
            existingZoneIds.add(docSnap.id);
          });

          let healedCount = 0;
          for (const z of seeded.zones) {
            if (!existingZoneIds.has(z.id)) {
              console.log(`[Firestore Client] Auto-healing missing default zone: ${z.name} (${z.id})`);
              await setDoc(doc(db, "zones", z.id), z);
              healedCount++;
            }
          }
          if (healedCount > 0) {
            console.log(`[Firestore Client] Auto-healed ${healedCount} missing zones.`);
          }
        } catch (e) {
          console.warn("[Firestore Client] Auto-healing: Failed to check/seed zones:", e);
        }

        try {
          const switchesSnap = await getDocs(collection(db, "device_switches"));
          if (switchesSnap.empty) {
            console.log("[Firestore Client] Auto-healing: Device switches collection is empty. Seeding defaults...");
            const seeded = getSeededDB();
            for (const sw of seeded.device_switches) {
              await setDoc(doc(db, "device_switches", sw.id), sw);
            }
          }
        } catch (e) {
          console.warn("[Firestore Client] Auto-healing: Failed to check/seed device_switches:", e);
        }

        try {
          const opTasksSnap = await getDocs(collection(db, "operational_tasks"));
          if (opTasksSnap.empty) {
            console.log("[Firestore Client] Auto-healing: Operational tasks collection is empty. Seeding defaults...");
            const seeded = getSeededDB();
            for (const ot of seeded.operational_tasks) {
              await setDoc(doc(db, "operational_tasks", ot.id), ot);
            }
          }
        } catch (e) {
          console.warn("[Firestore Client] Auto-healing: Failed to check/seed operational_tasks:", e);
        }

        try {
          const templatesSnap = await getDocs(collection(db, "task_templates"));
          if (templatesSnap.empty) {
            console.log("[Firestore Client] Auto-healing: Templates collection is empty. Seeding defaults...");
            const seeded = getSeededDB();
            for (const t of seeded.task_templates) {
              await setDoc(doc(db, "task_templates", t.id), t);
            }
          }
        } catch (e) {
          console.warn("[Firestore Client] Auto-healing: Failed to check/seed task_templates:", e);
        }

        return;
      }
      
      console.log("[Firestore Client] Firestore is empty. Checking for local database to seed...");
      
      if (hasCustomLocalData) {
        console.log("[Firestore Client] Seeding from friend's local database to prevent duplication or loss of offline additions!");
        
        // 1. Seed users (profiles)
        // Combine seeded default users with any custom local users
        const seeded = getSeededDB();
        const usersMap: Record<string, any> = {};
        for (const p of seeded.profiles) {
          usersMap[p.id] = p;
        }
        if (localDbData.users) {
          for (const uid of Object.keys(localDbData.users)) {
            usersMap[uid] = localDbData.users[uid];
          }
        }
        for (const pId of Object.keys(usersMap)) {
          const profileToSeed = {
            ...usersMap[pId],
            password: await normalizePasswordRecord(usersMap[pId].password, usersMap[pId].username === "admin" ? "admin123" : "123456")
          };
          await setDoc(doc(db, "users", pId), profileToSeed);
        }

        // Helper function to seed from local or fallback to default list
        const seedCollection = async (colName: string, defaultList: any[]) => {
          const localItems = localDbData[colName] || {};
          const localKeys = Object.keys(localItems);
          
          if (localKeys.length > 0) {
            console.log(`[Firestore Client] Seeding ${localKeys.length} items from local database for collection: ${colName}`);
            for (const key of localKeys) {
              await setDoc(doc(db, colName, key), localItems[key]);
            }
          } else {
            console.log(`[Firestore Client] Local database is empty for ${colName}. Seeding default ${defaultList.length} items.`);
            for (const item of defaultList) {
              await setDoc(doc(db, colName, item.id), item);
            }
          }
        };

        // Seed all collections
        await seedCollection("locations", seeded.locations);
        await seedCollection("zones", seeded.zones);
        await seedCollection("task_templates", seeded.task_templates);
        await seedCollection("task_instances", seeded.task_instances);
        await seedCollection("operational_tasks", seeded.operational_tasks);
        await seedCollection("notifications", seeded.notifications);
        await seedCollection("device_switches", seeded.device_switches);
        await seedCollection("kpi_snapshots", seeded.kpi_snapshots);

      } else {
        console.log("[Firestore Client] No local database found. Seeding initial default data across collections...");
        const seeded = getSeededDB();
        
        // 1. Seed users (profiles)
        for (const p of seeded.profiles) {
          const profileToSeed = {
            ...p,
            password: await normalizePasswordRecord((p as any).password, p.username === "admin" ? "admin123" : "123456")
          };
          await setDoc(doc(db, "users", p.id), profileToSeed);
        }
        
        // 2. Seed locations
        for (const l of seeded.locations) {
          await setDoc(doc(db, "locations", l.id), l);
        }
        
        // 3. Seed zones
        for (const z of seeded.zones) {
          await setDoc(doc(db, "zones", z.id), z);
        }
        
        // 4. Seed task_templates
        for (const t of seeded.task_templates) {
          await setDoc(doc(db, "task_templates", t.id), t);
        }
        
        // 5. Seed task_instances
        for (const ti of seeded.task_instances) {
          await setDoc(doc(db, "task_instances", ti.id), ti);
        }
        
        // 6. Seed operational_tasks
        for (const ot of seeded.operational_tasks) {
          await setDoc(doc(db, "operational_tasks", ot.id), ot);
        }
        
        // 7. Seed notifications
        for (const n of seeded.notifications) {
          await setDoc(doc(db, "notifications", n.id), n);
        }
        
        // 8. Seed device_switches
        for (const sw of seeded.device_switches) {
          await setDoc(doc(db, "device_switches", sw.id), sw);
        }
        
        // 9. Seed kpi_snapshots
        for (const k of seeded.kpi_snapshots) {
          await setDoc(doc(db, "kpi_snapshots", k.id), k);
        }
      }
      
      console.log("[Firestore Client] Seeding completed successfully.");
    } catch (err) {
      console.error("[Firestore Client] Seeding failed, falling back to local database:", err);
      triggerLocalFallback(err);
    }
  })();
  
  return seedingPromise;
}

// --- Date Helpers ---
export function getLocalDateString() {
  const date = new Date();
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString();
  return localISOTime.split("T")[0];
}

export function getArabicDayName(dateStr?: string) {
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  if (!dateStr) {
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  }
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return days[date.getDay()];
  }
  const date = new Date(dateStr);
  return days[date.getDay()];
}

export function getDaysDiff(dateStr1: string, dateStr2: string) {
  const parseParts = (str: string) => {
    const p = str.split("-");
    if (p.length === 3) {
      return { y: parseInt(p[0], 10), m: parseInt(p[1], 10) - 1, d: parseInt(p[2], 10) };
    }
    const date = new Date(str);
    return { y: date.getFullYear(), m: date.getMonth(), d: date.getDate() };
  };
  const d1 = parseParts(dateStr1);
  const d2 = parseParts(dateStr2);
  const utc1 = Date.UTC(d1.y, d1.m, d1.d);
  const utc2 = Date.UTC(d2.y, d2.m, d2.d);
  return Math.floor(Math.abs(utc2 - utc1) / (1000 * 60 * 60 * 24));
}

// --- API Operations ---

const PRE_SEEDED_USERS = [
  { id: "p1", username: "admin", full_name: "أحمد المدير", phone: "01011112222", role: "admin" },
  { id: "p2", username: "afaf", full_name: "عفاف أحمد", phone: "01234567890", role: "cleaner" },
  { id: "p3", username: "rehab", full_name: "رحاب محمود", phone: "01122334455", role: "cleaner" },
  { id: "p4", username: "supervisor", full_name: "خالد المشرف", phone: "01555666777", role: "supervisor" }
];


export async function loginUser(username: string, password?: string): Promise<Profile> {
  const cleanInput = username.trim().toLowerCase();

  if (!password) {
    throw new Error("يرجى إدخال كلمة المرور");
  }

  await ensureSeeded();

  let snap;
  try {
    snap = await getDocs(collection(db, "users"));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "users");
  }

  const users: Profile[] = [];
  snap.forEach((docSnap) => {
    users.push(docSnap.data() as Profile);
  });

  let profile = users.find((p) => p.username?.trim().toLowerCase() === cleanInput);
  if (!profile) {
    profile = users.find((p) => p.phone?.trim() === cleanInput);
  }
  if (!profile) {
    profile = users.find((p) => p.full_name?.trim().toLowerCase() === cleanInput);
  }
  if (!profile && (cleanInput === "admin" || cleanInput.includes("مدير"))) {
    profile = users.find((p) => p.role === "admin" && p.is_active !== false);
  }

  if (!profile) {
    throw new Error("الموظف غير مسجل أو غير نشط في النظام");
  }

  if (profile.is_active === false) {
    throw new Error("هذا الحساب معطل أو غير نشط في النظام");
  }

  const fallbackPassword = profile.username === "admin" ? "admin123" : "123456";
  const storedPassword = profile.password || fallbackPassword;
  const matched = await verifyPassword(password, storedPassword);

  if (!matched) {
    throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
  }

  return profile;
}

export async function getCurrentUserProfile(email: string): Promise<Profile | null> {
  await ensureSeeded();
  if (!email) return null;
  const username = email.split("@")[0].toLowerCase();
  
  let snap;
  try {
    snap = await getDocs(collection(db, "users"));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "users");
  }

  let found: Profile | null = null;
  snap.forEach((docSnap) => {
    const data = docSnap.data() as Profile;
    if (data.username?.toLowerCase() === username) {
      found = data;
    }
  });
  return found;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function getProfiles(): Promise<Profile[]> {
  await ensureSeeded();
  if (cachedProfiles) return cachedProfiles;
  let snap;
  try {
    snap = await getDocs(collection(db, "users"));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "users");
  }
  const profiles: Profile[] = [];
  snap.forEach((docSnap) => {
    profiles.push(docSnap.data() as Profile);
  });
  cachedProfiles = profiles;
  return profiles;
}


function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

function randomHex(length = 16): string {
  return Array.from(getRandomBytes(length), (b) => b.toString(16).padStart(2, "0")).join("");
}

function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  const bytes = getRandomBytes(4);
  const view = new DataView(bytes.buffer);
  return view.getUint32(0, false) % maxExclusive;
}

function shuffleWithCrypto<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateSecureRandomPassword(length = 12): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specials = "!@#$*";
  const all = lower + upper + digits + specials;

  const seed = [
    lower[randomInt(lower.length)],
    upper[randomInt(upper.length)],
    digits[randomInt(digits.length)],
    specials[randomInt(specials.length)],
  ];

  while (seed.length < length) {
    seed.push(all[randomInt(all.length)]);
  }

  return shuffleWithCrypto(seed).join("");
}

function isStoredPasswordRecord(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{16,}:[a-f0-9]{64}$/i.test(value);
}

async function hashText(value: string): Promise<string> {
  if (typeof globalThis === "undefined" || !globalThis.crypto || !globalThis.crypto.subtle) {
    // Fallback only for extremely constrained runtimes.
    return `legacy:${value}`;
  }

  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function createPasswordRecord(plainPassword: string): Promise<string> {
  const salt = randomHex(16);
  const hash = await hashText(`${salt}:${plainPassword}`);
  return `${salt}:${hash}`;
}

async function normalizePasswordRecord(existingPassword: unknown, fallbackPlain: string): Promise<string> {
  if (isStoredPasswordRecord(existingPassword)) {
    return existingPassword;
  }

  const plain = typeof existingPassword === "string" && existingPassword.trim().length > 0
    ? existingPassword
    : fallbackPlain;

  return createPasswordRecord(plain);
}

async function verifyPassword(plainPassword: string, storedPassword: unknown): Promise<boolean> {
  if (typeof storedPassword !== "string" || !storedPassword) {
    return false;
  }

  if (isStoredPasswordRecord(storedPassword)) {
    const [salt, expectedHash] = storedPassword.split(":");
    const hash = await hashText(`${salt}:${plainPassword}`);
    return hash === expectedHash;
  }

  // Backward compatibility for legacy seeded data or pre-hashed runtime values.
  return storedPassword === plainPassword;
}

function makeDocumentId(prefix: string): string {
  return `${prefix}_${randomHex(8)}`;
}


export async function saveProfile(profile: Partial<Profile>): Promise<{ profile: Profile; generatedPassword?: string }> {
  await ensureSeeded();
  if (profile.is_active === undefined) {
    profile.is_active = true;
  }

  const { password, ...profileWithoutPassword } = profile as any;

  let finalProfile: any;
  let generatedPassword: string | undefined;

  if (!profile.id) {
    generatedPassword = typeof password === "string" && password.length > 0 ? password : generateSecureRandomPassword();
    finalProfile = {
      ...profileWithoutPassword,
      password: await createPasswordRecord(generatedPassword),
      id: makeDocumentId("p"),
      created_at: new Date().toISOString()
    };
  } else {
    const docRef = doc(db, "users", profile.id);
    let snap;
    try {
      snap = await getDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${profile.id}`);
    }
    const existing = snap.exists() ? snap.data() : {};

    if (typeof password === "string" && password.length > 0) {
      finalProfile = {
        ...existing,
        ...profileWithoutPassword,
        password: await createPasswordRecord(password)
      };
    } else if ((existing as any).password) {
      finalProfile = {
        ...existing,
        ...profileWithoutPassword,
        password: await normalizePasswordRecord((existing as any).password, profile.username === "admin" ? "admin123" : "123456")
      };
    } else {
      const fallback = profile.username === "admin" ? "admin123" : generateSecureRandomPassword();
      finalProfile = {
        ...existing,
        ...profileWithoutPassword,
        password: await createPasswordRecord(fallback)
      };
      generatedPassword = fallback;
    }
  }

  await setDoc(doc(db, "users", finalProfile.id), finalProfile);
  invalidateMetadataCaches();
  return { profile: finalProfile as Profile, generatedPassword };
}

export async function provisionEmployeeAuth(profileId: string): Promise<string> {
  await ensureSeeded();
  const docRef = doc(db, "users", profileId);
  let snap;
  try {
    snap = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${profileId}`);
  }
  if (!snap.exists()) {
    throw new Error("الموظف غير موجود في النظام");
  }
  const profile = snap.data() as Profile;
  const generatedPassword = generateSecureRandomPassword();

  await setDoc(docRef, {
    ...profile,
    password: await createPasswordRecord(generatedPassword)
  });

  return generatedPassword;
}

export async function initializeAdminAuth(): Promise<string> {
  await ensureSeeded();
  const docRef = doc(db, "users", "p1");
  let snap;
  try {
    snap = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "users/p1");
  }

  const defaultPassword = "admin123";
  if (snap.exists()) {
    const profile = snap.data() as Profile;
    await setDoc(docRef, {
      ...profile,
      password: await normalizePasswordRecord((profile as any).password, defaultPassword)
    });
  }

  return defaultPassword;
}

export async function getRawZones(): Promise<Zone[]> {
  await ensureSeeded();
  if (cachedZones) return cachedZones;
  let zonesSnap;
  try {
    zonesSnap = await getDocs(collection(db, "zones"));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "zones");
  }
  const zones: Zone[] = [];
  zonesSnap.forEach((docSnap) => {
    zones.push(docSnap.data() as Zone);
  });
  cachedZones = zones;
  return zones;
}

export async function getZones(): Promise<(Zone & { responsible_employee?: Profile })[]> {
  const zones = await getRawZones();
  const profiles = await getProfiles();
  
  const enrichedZones = zones.map((zone) => {
    const emp = profiles.find((p) => p.id === zone.responsible_employee_id);
    return { ...zone, responsible_employee: emp };
  });
  
  enrichedZones.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return enrichedZones;
}

export async function saveZone(zone: Partial<Zone>): Promise<Zone> {
  await ensureSeeded();
  let finalZone: any;
  if (!zone.id) {
    finalZone = {
      ...zone,
      id: "z_" + randomHex(8),
      created_at: new Date().toISOString()
    };
  } else {
    const docRef = doc(db, "zones", zone.id);
    let snap;
    try {
      snap = await getDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `zones/${zone.id}`);
    }
    const existing = snap.exists() ? snap.data() : {};
    finalZone = { ...existing, ...zone };
  }
  if (finalZone.cover_image_url && finalZone.cover_image_url.startsWith("data:")) {
    try {
      console.log(`[saveZone] Auto-uploading local base64 image to Firebase Storage for zone ${finalZone.id}...`);
      const storagePath = `zones/${finalZone.id}/cover_${Date.now()}.jpg`;
      const uploadedUrl = await uploadPhoto(finalZone.cover_image_url, storagePath);
      finalZone.cover_image_url = uploadedUrl;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(`naris_zone_image_${finalZone.id}`, uploadedUrl);
      }
    } catch (err) {
      console.warn(`[saveZone] Failed to auto-upload cover image to Firebase Storage:`, err);
    }
  }
  await setDoc(doc(db, "zones", finalZone.id), finalZone);
  invalidateMetadataCaches();
  return finalZone as Zone;
}

export async function getSopItems(): Promise<SOPItem[]> {
  await ensureSeeded();
  if (cachedSopItems) return cachedSopItems;
  
  if (useLocalFallback) {
    const items = Object.values(localDB.sop_items || {}) as SOPItem[];
    items.sort((a, b) => (a.task_code || "").localeCompare(b.task_code || ""));
    cachedSopItems = items;
    return items;
  }

  let snap;
  try {
    snap = await getDocs(collection(db, "sop_items"));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "sop_items");
  }
  const items: SOPItem[] = [];
  snap.forEach((docSnap) => {
    items.push(docSnap.data() as SOPItem);
  });
  items.sort((a, b) => (a.task_code || "").localeCompare(b.task_code || ""));
  cachedSopItems = items;
  return items;
}

export async function getTemplates(): Promise<TaskTemplate[]> {
  return getSopItems();
}

export async function pregenerateTaskInstances(tpl: SOPItem, daysCount = 30): Promise<void> {
  console.log(`[Pregenerate] Generating task instances for SOP item ${tpl.id} (${tpl.title}) for next ${daysCount} days...`);
  try {
    const profiles = await getProfiles();
    const zones = await getRawZones();
    
    // Get date strings for the next daysCount days (including today)
    const dates: string[] = [];
    const baseDate = new Date();
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
    }

    // Load existing instances for this SOP item in the date range
    let existingInstances: TaskInstance[] = [];
    if (useLocalFallback) {
      existingInstances = Object.values(localDB.task_instances || {}).filter(
        (ti: any) => (ti.sop_item_id === tpl.id || ti.template_id === tpl.id) && dates.includes(ti.due_date)
      ) as TaskInstance[];
    } else {
      // Direct query by sop_item_id
      const q = query(
        collection(db, "task_instances"),
        where("sop_item_id", "==", tpl.id)
      );
      const snap = await getDocs(q);
      snap.forEach((docSnap: any) => {
        const data = docSnap.data() as TaskInstance;
        if (dates.includes(data.due_date)) {
          existingInstances.push(data);
        }
      });

      // Backward compatible fallback query by template_id
      const qLegacy = query(
        collection(db, "task_instances"),
        where("template_id", "==", tpl.id)
      );
      const snapLegacy = await getDocs(qLegacy);
      snapLegacy.forEach((docSnap: any) => {
        const data = docSnap.data() as TaskInstance;
        if (dates.includes(data.due_date) && !existingInstances.some(x => x.id === data.id)) {
          existingInstances.push(data);
        }
      });
    }

    for (const dateStr of dates) {
      const todayDayNameAr = getArabicDayName(dateStr);
      let runsToday = false;
      
      if (tpl.frequency === "يومي") {
        runsToday = true;
      } else if (tpl.frequency === "يوم ويوم" || tpl.frequency === "يوم و يوم") {
        const createdDateStr = tpl.created_at ? tpl.created_at.split("T")[0] : "2026-07-01";
        const diffDays = getDaysDiff(createdDateStr, dateStr);
        runsToday = (diffDays % 2 === 0);
      } else if (tpl.frequency === "أسبوعي") {
        runsToday = !!(tpl.recurrence_days && tpl.recurrence_days.includes(todayDayNameAr));
      }

      if (runsToday) {
        const alreadyExists = existingInstances.some((ti) => ti.due_date === dateStr);
        if (!alreadyExists) {
          // Determine assignee
          let assignedTo = tpl.default_assignee_id || "";
          
          if (!assignedTo) {
            const tplZone = zones.find((z) => z.id === tpl.zone_id);
            if (tplZone?.responsible_employee_id) {
              const respEmp = profiles.find((p) => p.id === tplZone.responsible_employee_id && p.is_active);
              if (respEmp) {
                assignedTo = respEmp.id;
              }
            }
            
            if (!assignedTo) {
              const activeCleaners = profiles.filter((p) => p.is_active && p.role === "cleaner");
              let workingCleaners = activeCleaners.filter((p) => !p.work_days || p.work_days.includes(todayDayNameAr));
              
              if (workingCleaners.length === 0) {
                workingCleaners = activeCleaners;
              }
              
              if (workingCleaners.length > 0) {
                let bestCleaner = workingCleaners[0];
                let minTasks = Infinity;
                for (const cleaner of workingCleaners) {
                  const taskCount = existingInstances.filter((ti) => ti.assigned_to === cleaner.id && ti.due_date === dateStr).length;
                  if (taskCount < minTasks) {
                    minTasks = taskCount;
                    bestCleaner = cleaner;
                  }
                }
                assignedTo = bestCleaner.id;
              } else {
                const firstActive = profiles.find((p) => p.is_active);
                assignedTo = firstActive ? firstActive.id : "p2";
              }
            }
          }

          const id = `ti_rec_${tpl.id}_${dateStr}`;
          const newInstance: TaskInstance = {
            id,
            template_id: tpl.id, // Legacy compatibility
            sop_item_id: tpl.id,  // Direct master SOP item reference
            zone_id: tpl.zone_id,
            assigned_to: assignedTo,
            assigned_by: "p1",
            task_type: "recurring",
            title: tpl.title,
            description: tpl.description || "",
            goal: tpl.goal || "",
            task_code: tpl.task_code || "",
            category: tpl.category || "تشغيل",
            tools_required: tpl.tools_required || "",
            estimated_duration_minutes: tpl.estimated_duration_minutes || 0,
            due_date: dateStr,
            due_time: tpl.scheduled_time || "09:00",
            status: "pending",
            supervisor_approved: false,
            guide_image_url: tpl.guide_image_url || "",
            reference_image_url: tpl.reference_image_url || "",
            requires_photo_before: tpl.requires_photo_before ?? true,
            requires_photo_after: tpl.requires_photo_after ?? true,
            requires_supervisor_approval: tpl.requires_supervisor_approval ?? true,
            requires_gps: tpl.requires_gps ?? false,
            requires_signature: tpl.requires_signature ?? false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await setDoc(doc(db, "task_instances", id), newInstance);
          existingInstances.push(newInstance);
        }
      }
    }
    console.log(`[Pregenerate] Successfully pre-generated/verified task instances for SOP item ${tpl.id}.`);
  } catch (err) {
    console.error("[Pregenerate] Failed to pregenerate task instances:", err);
  }
}

export async function saveSopItem(item: Partial<SOPItem>): Promise<SOPItem> {
  await ensureSeeded();
  let finalItem: any;
  let oldAssigneeId: string | undefined;
  
  if (!item.id) {
    finalItem = {
      ...item,
      id: "sop_" + randomHex(8),
      created_at: new Date().toISOString()
    };
  } else {
    if (useLocalFallback) {
      const existing = localDB.sop_items[item.id] || {};
      oldAssigneeId = existing.default_assignee_id;
      finalItem = { ...existing, ...item, updated_at: new Date().toISOString() };
    } else {
      const docRef = doc(db, "sop_items", item.id);
      let snap;
      try {
        snap = await getDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `sop_items/${item.id}`);
      }
      const existing = snap.exists() ? snap.data() : {};
      oldAssigneeId = existing.default_assignee_id;
      finalItem = { ...existing, ...item, updated_at: new Date().toISOString() };
    }
  }
  
  if (finalItem.guide_image_url && finalItem.guide_image_url.startsWith("data:")) {
    try {
      console.log(`[saveSopItem] Auto-uploading guide image to Firebase Storage for SOP item ${finalItem.id}...`);
      const storagePath = `sop_items/guide_${finalItem.id}_${Date.now()}.jpg`;
      const uploadedUrl = await uploadPhoto(finalItem.guide_image_url, storagePath);
      finalItem.guide_image_url = uploadedUrl;
    } catch (err) {
      console.warn(`[saveSopItem] Failed to auto-upload guide image:`, err);
    }
  }

  if (finalItem.reference_image_url && finalItem.reference_image_url.startsWith("data:")) {
    try {
      console.log(`[saveSopItem] Auto-uploading reference image to Firebase Storage for SOP item ${finalItem.id}...`);
      const storagePath = `sop_items/ref_${finalItem.id}_${Date.now()}.jpg`;
      const uploadedUrl = await uploadPhoto(finalItem.reference_image_url, storagePath);
      finalItem.reference_image_url = uploadedUrl;
    } catch (err) {
      console.warn(`[saveSopItem] Failed to auto-upload reference image:`, err);
    }
  }
  
  if (useLocalFallback) {
    localDB.sop_items[finalItem.id] = finalItem;
    saveLocalDB();
  } else {
    await setDoc(doc(db, "sop_items", finalItem.id), finalItem);
  }
  
  // Pregenerate task instances for the next 30 days
  await pregenerateTaskInstances(finalItem, 30);
  
  // Sync all detail changes to any future pending task instances
  if (item.id) {
    console.log(`[SOP Detail Sync] Syncing updated SOP configurations for ${finalItem.title} to future pending task instances...`);
    try {
      let existingInstances: TaskInstance[] = [];
      if (useLocalFallback) {
        existingInstances = Object.values(localDB.task_instances || {}).filter(
          (ti: any) => (ti.sop_item_id === finalItem.id || ti.template_id === finalItem.id)
        ) as TaskInstance[];
      } else {
        const q = query(
          collection(db, "task_instances"),
          where("sop_item_id", "==", finalItem.id)
        );
        const snap = await getDocs(q);
        snap.forEach((docSnap) => {
          existingInstances.push(docSnap.data() as TaskInstance);
        });

        const qLegacy = query(
          collection(db, "task_instances"),
          where("template_id", "==", finalItem.id)
        );
        const snapLegacy = await getDocs(qLegacy);
        snapLegacy.forEach((docSnap) => {
          if (!existingInstances.some(x => x.id === docSnap.id)) {
            existingInstances.push(docSnap.data() as TaskInstance);
          }
        });
      }

      const todayStr = getLocalDateString();
      for (const ti of existingInstances) {
        if (ti.due_date >= todayStr && (ti.status === "pending" || !ti.status)) {
          const updatedInstance = {
            ...ti,
            title: finalItem.title,
            description: finalItem.description || "",
            goal: finalItem.goal || "",
            task_code: finalItem.task_code || "",
            category: finalItem.category || "تشغيل",
            tools_required: finalItem.tools_required || "",
            estimated_duration_minutes: finalItem.estimated_duration_minutes || 0,
            zone_id: finalItem.zone_id,
            guide_image_url: finalItem.guide_image_url || "",
            reference_image_url: finalItem.reference_image_url || "",
            requires_photo_before: finalItem.requires_photo_before ?? true,
            requires_photo_after: finalItem.requires_photo_after ?? true,
            requires_supervisor_approval: finalItem.requires_supervisor_approval ?? true,
            requires_gps: finalItem.requires_gps ?? false,
            requires_signature: finalItem.requires_signature ?? false,
            assigned_to: finalItem.default_assignee_id || ti.assigned_to,
            due_time: finalItem.scheduled_time || ti.due_time || "09:00",
            updated_at: new Date().toISOString()
          };
          
          if (useLocalFallback) {
            localDB.task_instances[ti.id] = updatedInstance;
          } else {
            await setDoc(doc(db, "task_instances", ti.id), updatedInstance);
          }
        }
      }
      if (useLocalFallback) {
        saveLocalDB();
      }
    } catch (err) {
      console.error("[SOP Sync] Failed to sync to future tasks:", err);
    }
  }

  invalidateMetadataCaches();
  return finalItem as SOPItem;
}

export async function saveTemplate(template: Partial<TaskTemplate>): Promise<TaskTemplate> {
  return saveSopItem(template);
}

export async function deleteSopItem(id: string): Promise<void> {
  if (!id || typeof id !== "string" || id.trim() === "") {
    console.error("[Firestore Client] deleteSopItem: Invalid or empty ID provided:", id);
    throw new Error("معرف البند المعياري (ID) غير صالح أو مفقود.");
  }
  
  await ensureSeeded();
  try {
    if (useLocalFallback) {
      if (localDB.sop_items[id]) delete localDB.sop_items[id];
      saveLocalDB();
    } else {
      console.log(`[Firestore Client] Deleting master SOP item: ${id}...`);
      await deleteDoc(doc(db, "sop_items", id));
    }
    invalidateMetadataCaches();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `sop_items/${id}`);
    throw error;
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  return deleteSopItem(id);
}

export async function getTasks(dateStr?: string): Promise<(TaskInstance & { zone?: Zone; assignee?: Profile; template?: TaskTemplate })[]> {
  await ensureSeeded();
  const todayStr = dateStr || getLocalDateString();
  
  let instancesSnap;
  try {
    instancesSnap = await getDocs(
      query(collection(db, "task_instances"), where("due_date", "==", todayStr))
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "task_instances");
  }
  
  const instances: TaskInstance[] = [];
  instancesSnap.forEach((docSnap) => {
    instances.push(docSnap.data() as TaskInstance);
  });

  // Load profiles and zones early to support smart "Flexible Auto-Distribution"
  const profiles = await getProfiles();

  let zonesSnap;
  try {
    zonesSnap = await getDocs(collection(db, "zones"));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "zones");
  }
  const zones: Zone[] = [];
  zonesSnap.forEach((docSnap) => {
    zones.push(docSnap.data() as Zone);
  });
  
  // Generate missing recurring tasks for active templates that run today per-template
  const templates = await getTemplates();
  const todayDayNameAr = getArabicDayName(todayStr);
  let generatedAny = false;
  
  for (const tpl of templates) {
    if (!tpl.is_active) continue;
    
    let runsToday = false;
    if (tpl.frequency === "يومي") {
      runsToday = true;
    } else if (tpl.frequency === "يوم ويوم" || tpl.frequency === "يوم و يوم") {
      const createdDateStr = tpl.created_at ? tpl.created_at.split("T")[0] : "2026-07-01";
      const diffDays = getDaysDiff(createdDateStr, todayStr);
      runsToday = (diffDays % 2 === 0);
    } else if (tpl.frequency === "أسبوعي") {
      runsToday = !!(tpl.recurrence_days && tpl.recurrence_days.includes(todayDayNameAr));
    }
    
    if (runsToday) {
      // Check if an instance of this specific recurring template already exists for today
      const alreadyExists = instances.some((ti) => ti.template_id === tpl.id && ti.due_date === todayStr);
      
      if (!alreadyExists) {
        if (!generatedAny) {
          console.log(`[Firestore Client] Generating missing recurring SOP tasks for ${todayStr}...`);
          generatedAny = true;
        }

        // Determine assignee (Flexible Auto-Distribution logic)
        let assignedTo = tpl.default_assignee_id || "";
        
        if (!assignedTo) {
          // 1. Try assigning to the responsible employee for the zone of this template
          const tplZone = zones.find((z) => z.id === tpl.zone_id);
          if (tplZone?.responsible_employee_id) {
            const respEmp = profiles.find((p) => p.id === tplZone.responsible_employee_id && p.is_active);
            if (respEmp) {
              assignedTo = respEmp.id;
            }
          }
          
          // 2. If no zone-specific employee is found, load-balance among active cleaners
          if (!assignedTo) {
            const activeCleaners = profiles.filter((p) => p.is_active && p.role === "cleaner");
            // Filter by cleaners working today based on their work_days
            let workingCleaners = activeCleaners.filter((p) => !p.work_days || p.work_days.includes(todayDayNameAr));
            
            // Fallback to all active cleaners if no cleaner is explicitly scheduled for today
            if (workingCleaners.length === 0) {
              workingCleaners = activeCleaners;
            }
            
            if (workingCleaners.length > 0) {
              // Find the cleaner with the fewest tasks assigned today so far
              let bestCleaner = workingCleaners[0];
              let minTasks = Infinity;
              
              for (const cleaner of workingCleaners) {
                const taskCount = instances.filter((ti) => ti.assigned_to === cleaner.id).length;
                if (taskCount < minTasks) {
                  minTasks = taskCount;
                  bestCleaner = cleaner;
                }
              }
              assignedTo = bestCleaner.id;
            } else {
              // Final fallback to the first active employee or hardcoded "p2"
              const firstActive = profiles.find((p) => p.is_active);
              assignedTo = firstActive ? firstActive.id : "p2";
            }
          }
        }

        const id = `ti_rec_${tpl.id}_${todayStr}`;
        const newInstance: TaskInstance = {
          id,
          template_id: tpl.id,
          zone_id: tpl.zone_id,
          assigned_to: assignedTo,
          assigned_by: "p1",
          task_type: "recurring",
          title: tpl.title,
          description: tpl.description || "",
          goal: tpl.goal || "",
          task_code: tpl.task_code || "",
          category: tpl.category || "تشغيل",
          tools_required: tpl.tools_required || "",
          estimated_duration_minutes: tpl.estimated_duration_minutes || 0,
          due_date: todayStr,
          due_time: tpl.scheduled_time || "09:00",
          status: "pending",
          supervisor_approved: false,
          guide_image_url: tpl.guide_image_url || "",
          reference_image_url: tpl.reference_image_url || "",
          requires_photo_before: tpl.requires_photo_before ?? true,
          requires_photo_after: tpl.requires_photo_after ?? true,
          requires_supervisor_approval: tpl.requires_supervisor_approval ?? true,
          requires_gps: tpl.requires_gps ?? false,
          requires_signature: tpl.requires_signature ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await setDoc(doc(db, "task_instances", id), newInstance);
        instances.push(newInstance);
      }
    }
  }
  
  return instances.map((ti) => {
    const zone = zones.find((z) => z.id === ti.zone_id);
    const assignee = profiles.find((p) => p.id === ti.assigned_to);
    const template = templates.find((tpl) => tpl.id === ti.template_id);
    return {
      ...ti,
      zone,
      assignee,
      template
    };
  });
}

export function listenTodayTasks(
  userId: string | undefined, 
  callback: (tasks: (TaskInstance & { zone?: Zone; assignee?: Profile; template?: TaskTemplate })[]) => void
): () => void {
  const todayStr = getLocalDateString();
  const cacheKey = userId || "all";
  
  // 1. Immediately feed cached tasks to UI for rapid, offline-first loading
  try {
    const cached = getCachedTasks(cacheKey);
    if (cached && cached.length > 0) {
      const pending = getPendingUpdates();
      const merged = cached.map(task => {
        const match = pending.find(p => p.taskId === task.id);
        if (match) {
          return { ...task, ...match.updates };
        }
        return task;
      });
      callback(merged);
    }
  } catch (err) {
    console.error("[Offline Engine] Failed to load cached tasks on start", err);
  }
  
  // Fire off getTasks in background to generate any missing recurring tasks
  getTasks(todayStr).catch(console.error);

  const q = query(
    collection(db, "task_instances"), 
    where("due_date", "==", todayStr)
  );

  const unsubscribe = onSnapshot(q, async (snap) => {
    try {
      const instances: TaskInstance[] = [];
      snap.forEach((docSnap) => {
        instances.push(docSnap.data() as TaskInstance);
      });

      const filteredInstances = userId 
        ? instances.filter(ti => ti.assigned_to === userId)
        : instances;

      const [zonesSnap, profiles, templates] = await Promise.all([
        getDocs(collection(db, "zones")),
        getProfiles(),
        getTemplates()
      ]);

      const zones: Zone[] = [];
      zonesSnap.forEach((d) => zones.push(d.data() as Zone));

      const enrichedTasks = filteredInstances.map((ti) => {
        const zone = zones.find((z) => z.id === ti.zone_id);
        const assignee = profiles.find((p) => p.id === ti.assigned_to);
        const template = templates.find((tpl) => tpl.id === ti.template_id);
        return {
          ...ti,
          zone,
          assignee,
          template
        };
      });

      // Sort by creation time so they appear predictably, or we can sort by due_time
      enrichedTasks.sort((a, b) => {
         if (a.due_time !== b.due_time) {
            return (a.due_time || "").localeCompare(b.due_time || "");
         }
         return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // 2. Merge pending local updates that haven't synchronized to the server yet
      const pending = getPendingUpdates();
      const synchronizedTasks = enrichedTasks.map(task => {
        const match = pending.find(p => p.taskId === task.id);
        if (match) {
          return { ...task, ...match.updates };
        }
        return task;
      });

      // 3. Save to localStorage cache
      saveCachedTasks(cacheKey, synchronizedTasks);

      callback(synchronizedTasks);
    } catch (error) {
      console.error("Error processing real-time tasks:", error);
    }
  }, (error) => {
    console.error("Error listening to task_instances:", error);
  });

  return unsubscribe;
}

export async function getTasksForRange(startDate: string, endDate: string): Promise<(TaskInstance & { zone?: Zone; assignee?: Profile; template?: TaskTemplate })[]> {
  await ensureSeeded();
  
  let instancesSnap;
  try {
    // Fetch all instances and filter locally to avoid complex Firestore composite index requirements
    instancesSnap = await getDocs(collection(db, "task_instances"));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "task_instances");
  }
  
  const instances: TaskInstance[] = [];
  if (instancesSnap) {
    instancesSnap.forEach((docSnap) => {
      const data = docSnap.data() as TaskInstance;
      if (data.due_date >= startDate && data.due_date <= endDate) {
        instances.push(data);
      }
    });
  }
  
  const templates = await getTemplates();
  let zonesSnap;
  try {
    zonesSnap = await getDocs(collection(db, "zones"));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "zones");
  }
  
  const zones: Zone[] = [];
  if (zonesSnap) {
    zonesSnap.forEach((docSnap) => {
      zones.push(docSnap.data() as Zone);
    });
  }
  
  const profiles = await getProfiles();
  
  return instances.map((ti) => {
    const zone = zones.find((z) => z.id === ti.zone_id);
    const assignee = profiles.find((p) => p.id === ti.assigned_to);
    const template = templates.find((tpl) => tpl.id === ti.template_id);
    return {
      ...ti,
      zone,
      assignee,
      template
    };
  });
}

export async function createTask(task: Partial<TaskInstance>): Promise<TaskInstance> {
  await ensureSeeded();
  const id = "ti_" + randomHex(8);
  const newInstance: TaskInstance = {
    id,
    zone_id: (task.zone_id && task.zone_id !== "z1") ? task.zone_id : "z_reception",
    template_id: task.template_id || null,
    assigned_to: task.assigned_to || "p2",
    assigned_by: task.assigned_by || "p1",
    task_type: task.task_type || "one_time",
    title: task.title || "",
    description: task.description || "",
    due_date: task.due_date || getLocalDateString(),
    due_time: task.due_time || "12:00",
    status: task.status || "pending",
    requires_photo_before: task.requires_photo_before !== undefined ? task.requires_photo_before : true,
    requires_photo_after: task.requires_photo_after !== undefined ? task.requires_photo_after : true,
    supervisor_approved: task.supervisor_approved || false,
    photo_before_url: task.photo_before_url || null,
    photo_after_url: task.photo_after_url || null,
    employee_notes: task.employee_notes || null,
    employee_signature_url: task.employee_signature_url || null,
    supervisor_notes: task.supervisor_notes || null,
    quality_grade: task.quality_grade || null,
    guide_image_url: task.guide_image_url || null,
    reference_image_url: task.reference_image_url || null,
    created_at: task.created_at || new Date().toISOString(),
    updated_at: task.updated_at || new Date().toISOString()
  };
  
  await setDoc(doc(db, "task_instances", id), newInstance);
  return newInstance;
}

function validateTaskInstanceUpdate(merged: TaskInstance, updates: Partial<TaskInstance>) {
  // 1. Enforce "before photo" requirement
  const requiresBefore = merged.requires_photo_before === true;
  if (requiresBefore && (updates.status === "in_progress" || updates.status === "completed" || merged.status === "completed")) {
    if (!merged.photo_before_url) {
      throw new Error("خطأ حماية: لا يمكن بدء أو إكمال هذه المهمة بدون التقاط ورفع صورة إثبات ما قبل البدء (Before Photo).");
    }
  }

  // 2. Enforce "after photo" requirement
  const requiresAfter = merged.requires_photo_after === true;
  if (requiresAfter && (updates.status === "completed" || merged.status === "completed")) {
    if (!merged.photo_after_url) {
      throw new Error("خطأ حماية: لا يمكن إغلاق وإكمال هذه المهمة بدون التقاط ورفع صورة إثبات جودة العمل (After Photo).");
    }
  }

  // Prevent lifting After photo before Before photo
  if (updates.photo_after_url && requiresBefore && !merged.photo_before_url) {
    throw new Error("خطأ حماية: لا يمكن رفع صورة الإثبات بعد العمل قبل رفع صورة الإثبات قبل العمل.");
  }

  // 3. Enforce "signature" requirement
  const requiresSignature = merged.requires_signature === true;
  if (requiresSignature && (updates.status === "completed" || merged.status === "completed")) {
    if (!merged.employee_signature_url) {
      throw new Error("خطأ حماية: لا يمكن إكمال هذه المهمة بدون التوقيع الإلكتروني المطلوب.");
    }
  }
}

function handleOfflineUpdate(id: string, updates: Partial<TaskInstance>): TaskInstance {
  console.log(`[Offline Engine] Saving local update for task: ${id}`, updates);
  
  // Try to find the task in local cache
  let cachedTask: any = null;
  let cachedUserId: string = "";
  
  if (typeof localStorage !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("naris_cached_tasks_")) {
        const userId = key.replace("naris_cached_tasks_", "");
        const tasks = getCachedTasks(userId);
        const found = tasks.find(t => t.id === id);
        if (found) {
          cachedTask = found;
          cachedUserId = userId;
          break;
        }
      }
    }
  }

  if (!cachedTask) {
    cachedTask = { id, status: 'pending', created_at: new Date().toISOString() };
  }

  const merged = { ...cachedTask, ...updates, updated_at: new Date().toISOString() };
  
  // Strict completion contract validation BEFORE saving local task state or queueing updates
  validateTaskInstanceUpdate(merged, updates);

  if (updates.status === "in_progress" && !cachedTask.started_at) {
    merged.started_at = new Date().toISOString();
  }
  
  if (updates.status === "completed" && !cachedTask.completed_at) {
    merged.completed_at = new Date().toISOString();
    if (!merged.photo_after_taken_at) {
      merged.photo_after_taken_at = updates.photo_after_taken_at || new Date().toISOString();
    }
    merged.photo_after_uploaded_at = updates.photo_after_uploaded_at || new Date().toISOString();
  }

  // Save the pending update
  addPendingUpdate(id, updates);

  // Update cached tasks in localStorage across all appropriate user keys
  syncTaskAcrossCaches(merged);

  return merged;
}

export async function syncOfflineTasks(): Promise<number> {
  // Offline sync is completely disabled/deactivated in online-only production mode
  return 0;
}

// Background auto-sync listener setup
if (typeof window !== "undefined") {
  window.addEventListener('online', () => {
    console.log("[Offline Engine] Network online detected. Triggering sync...");
    syncOfflineTasks().catch(console.error);
  });
  
  // Every 15 seconds try to sync if online
  setInterval(() => {
    if (isOnline()) {
      syncOfflineTasks().catch(console.error);
    }
  }, 15000);
}

export async function updateTask(id: string, updates: Partial<TaskInstance>): Promise<TaskInstance> {
  if (!isOnline()) {
    throw new Error("لا يوجد اتصال بالإنترنت. يرجى إعادة الاتصال بالشبكة للمحاولة مرة أخرى.");
  }

  try {
    await ensureSeeded();
    const docRef = doc(db, "task_instances", id);
    let snap;
    try {
      snap = await getDoc(docRef);
    } catch (error) {
      console.error("[Online Engine] getDoc failed:", error);
      throw new Error("تعذر الاتصال بقاعدة البيانات. يرجى التحقق من اتصالك بالإنترنت.");
    }
    
    if (!snap.exists()) {
      throw new Error("المهمة المطلوبة غير موجودة في قاعدة البيانات");
    }
    
    const currentTask = snap.data() as TaskInstance;
    
    // 1. Prevent duplicate completion
    if (currentTask.status === "completed" && updates.status === "completed") {
      throw new Error("تنبيه: تم إكمال هذه المهمة بالفعل مسبقاً ولا يمكن إعادة تسليمها.");
    }

    let template: any;
    const sopId = currentTask.sop_item_id || currentTask.template_id;
    if (sopId) {
      try {
        const tplSnap = await getDoc(doc(db, "sop_items", sopId));
        if (tplSnap.exists()) {
          template = tplSnap.data();
        } else {
          const legacySnap = await getDoc(doc(db, "task_templates", sopId));
          if (legacySnap.exists()) {
            template = legacySnap.data();
          }
        }
      } catch (error) {
        console.warn("Could not retrieve SOP master item", error);
      }
    }
    
    const merged = { ...currentTask, ...updates, updated_at: new Date().toISOString() };

    // 2. Enforce "before photo" requirement
    const requiresBefore = template ? template.requires_photo_before : true;
    if (requiresBefore && (updates.status === "in_progress" || updates.status === "completed")) {
      if (!merged.photo_before_url) {
        throw new Error("خطأ حماية: لا يمكن بدء أو إكمال هذه المهمة بدون التقاط ورفع صورة إثبات ما قبل البدء (Before Photo).");
      }
    }

    // 3. Enforce "after photo" requirement
    const requiresAfter = template ? template.requires_photo_after : true;
    if (requiresAfter && updates.status === "completed") {
      if (!merged.photo_after_url) {
        throw new Error("خطأ حماية: لا يمكن إغلاق وإكمال هذه المهمة بدون التقاط ورفع صورة إثبات جودة العمل (After Photo).");
      }
    }

    // Prevent lifting After photo before Before photo
    if (updates.photo_after_url && requiresBefore && !merged.photo_before_url) {
      throw new Error("خطأ حماية: لا يمكن رفع صورة الإثبات بعد العمل قبل رفع صورة الإثبات قبل العمل.");
    }

    // 4. Validate rework tasks
    if (merged.task_type === "rework" && !merged.parent_instance_id) {
      throw new Error("خطأ حماية: لا يمكن إنشاء أو تحديث مهمة إعادة عمل (Rework) بدون الإشارة إلى المهمة الأصلية (Parent Reference).");
    }

    if (updates.photo_before_url && !currentTask.photo_before_url) {
      merged.photo_before_taken_at = updates.photo_before_taken_at || new Date().toISOString();
      merged.photo_before_uploaded_at = updates.photo_before_uploaded_at || new Date().toISOString();
    }

    if (updates.status === "in_progress" && !currentTask.started_at) {
      merged.started_at = new Date().toISOString();
    }
    
    if (updates.status === "completed" && !currentTask.completed_at) {
      merged.completed_at = new Date().toISOString();
      if (!merged.photo_after_taken_at) {
        merged.photo_after_taken_at = updates.photo_after_taken_at || new Date().toISOString();
      }
      merged.photo_after_uploaded_at = updates.photo_after_uploaded_at || new Date().toISOString();
      
      if (currentTask.due_time && currentTask.due_date) {
        try {
          const dueDateTime = new Date(`${currentTask.due_date}T${currentTask.due_time}:00`);
          const completedTime = new Date(merged.completed_at);
          const diffMs = completedTime.getTime() - dueDateTime.getTime();
          merged.delay_minutes = diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
        } catch (e) {
          console.error("Error parsing date for delay calc", e);
        }
      }
      
      const requiresApproval = template ? template.requires_supervisor_approval : true;
      if (!requiresApproval) {
        merged.supervisor_approved = true;
        merged.supervisor_approved_at = new Date().toISOString();
        merged.quality_grade = "A";
      }
    }
    
    if (merged.photo_before_url && merged.photo_before_url.startsWith("data:")) {
      try {
        console.log(`[updateTaskInstance] Auto-uploading local before photo to Firebase Storage for task ${id}...`);
        const storagePath = `tasks/${id}/before_${Date.now()}.jpg`;
        const uploadedUrl = await uploadPhoto(merged.photo_before_url, storagePath);
        merged.photo_before_url = uploadedUrl;
      } catch (err) {
        console.warn(`[updateTaskInstance] Failed to auto-upload photo_before to Firebase Storage:`, err);
      }
    }

    if (merged.photo_after_url && merged.photo_after_url.startsWith("data:")) {
      try {
        console.log(`[updateTaskInstance] Auto-uploading local after photo to Firebase Storage for task ${id}...`);
        const storagePath = `tasks/${id}/after_${Date.now()}.jpg`;
        const uploadedUrl = await uploadPhoto(merged.photo_after_url, storagePath);
        merged.photo_after_url = uploadedUrl;
      } catch (err) {
        console.warn(`[updateTaskInstance] Failed to auto-upload photo_after to Firebase Storage:`, err);
      }
    }

    try {
      await setDoc(docRef, merged);
    } catch (error) {
      console.error("[Online Engine] setDoc failed:", error);
      throw new Error("تعذر حفظ تحديث المهمة. يرجى التحقق من اتصالك بالإنترنت.");
    }
    return merged;
  } catch (error: any) {
    if (error.message && (error.message.includes("خطأ حماية") || error.message.includes("تنبيه") || error.message.includes("اتصال بالإنترنت") || error.message.includes("الاتصال بقاعدة البيانات") || error.message.includes("تعذر حفظ تحديث المهمة"))) {
      throw error;
    }
    console.error("[Online Engine] General failure in updateTask:", error);
    throw new Error(error.message || "حدث خطأ غير متوقع أثناء تحديث المهمة.");
  }
}

export async function approveTask(id: string, approval: { supervisor_id: string; quality_grade: 'A' | 'B' | 'C'; supervisor_notes?: string }): Promise<TaskInstance> {
  await ensureSeeded();
  const docRef = doc(db, "task_instances", id);
  let snap;
  try {
    snap = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `task_instances/${id}`);
  }
  if (!snap.exists()) {
    throw new Error("المهمة المراد اعتمادها غير موجودة");
  }
  
  const task = snap.data() as TaskInstance;

  // 5. Prevent approval before completion
  if (task.status !== "completed") {
    throw new Error("خطأ حماية: لا يمكن اعتماد مهمة لم يكتمل تنفيذها وتأكيد تسليمها من قبل الموظف بعد.");
  }
  
  task.status = "completed";
  task.supervisor_approved = true;
  task.supervisor_approved_by = approval.supervisor_id || "p1";
  task.supervisor_approved_at = new Date().toISOString();
  task.quality_grade = approval.quality_grade || "A";
  task.supervisor_notes = approval.supervisor_notes || "";
  task.updated_at = new Date().toISOString();
  
  await setDoc(docRef, task);
  return task;
}

export async function rejectTask(id: string, rejection: { supervisor_id: string; supervisor_notes: string }): Promise<{ original: TaskInstance; rework: TaskInstance }> {
  await ensureSeeded();
  const docRef = doc(db, "task_instances", id);
  let snap;
  try {
    snap = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `task_instances/${id}`);
  }
  if (!snap.exists()) {
    throw new Error("المهمة غير موجودة");
  }
  
  const originalTask = snap.data() as TaskInstance;
  
  // Prevent duplicate rework creation
  if (originalTask.status === "rejected") {
    throw new Error("تنبيه: تم رفض هذه المهمة بالفعل مسبقاً، وهنالك أمر إعادة تنظيف (Rework) جارٍ العمل عليه لها.");
  }
  
  originalTask.status = "rejected";
  originalTask.supervisor_approved = false;
  originalTask.supervisor_approved_by = rejection.supervisor_id || "p1";
  originalTask.supervisor_approved_at = new Date().toISOString();
  originalTask.supervisor_notes = rejection.supervisor_notes || "مرفوضة وتحتاج لإعادة التنظيف";
  originalTask.updated_at = new Date().toISOString();
  
  await setDoc(docRef, originalTask);
  
  const reworkId = "ti_rework_" + randomHex(8);
  const reworkTask: TaskInstance = {
    id: reworkId,
    template_id: originalTask.template_id,
    zone_id: originalTask.zone_id,
    assigned_to: originalTask.assigned_to,
    assigned_by: rejection.supervisor_id || "p1",
    task_type: "rework",
    parent_instance_id: originalTask.id,
    title: `إعادة تنظيف: ${originalTask.title} ⚠️`,
    description: `سبب الرفض: ${rejection.supervisor_notes || "ملاحظات المشرف"}. يرجى إعادة التنظيف بالكامل والتقاط صور واضحة بعد الانتهاء.`,
    due_date: getLocalDateString(),
    due_time: "17:00",
    status: "pending",
    supervisor_approved: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  await setDoc(doc(db, "task_instances", reworkId), reworkTask);
  return { original: originalTask, rework: reworkTask };
}

export interface KpiSummary {
  profile_id: string;
  cleaner_name: string;
  username: string;
  tasks_assigned: number;
  tasks_completed_on_time: number;
  tasks_late: number;
  tasks_reworked: number;
  tasks_rejected: number;
  compliance_rate: number;
  avg_execution_time_minutes: number;
  quality_score: number;
  supervisor_rating: number;
}

export async function getKpis(): Promise<KpiSummary[]> {
  await ensureSeeded();
  const profiles = await getProfiles();
  const cleaners = profiles.filter((p) => p.role === "cleaner");
  
  let instancesSnap;
  try {
    instancesSnap = await getDocs(collection(db, "task_instances"));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "task_instances");
  }
  const tasks: TaskInstance[] = [];
  instancesSnap.forEach((docSnap) => {
    tasks.push(docSnap.data() as TaskInstance);
  });
  
  const kpisData = cleaners.map((cleaner) => {
    const cleanerTasks = tasks.filter((t) => t.assigned_to === cleaner.id);
    
    const total = cleanerTasks.length;
    const completed = cleanerTasks.filter((t) => t.status === "completed" && t.supervisor_approved).length;
    const onTime = cleanerTasks.filter((t) => t.status === "completed" && t.supervisor_approved && (t.delay_minutes || 0) <= 0).length;
    const late = cleanerTasks.filter((t) => t.status === "completed" && (t.delay_minutes || 0) > 0).length;
    const reworked = cleanerTasks.filter((t) => t.task_type === "rework").length;
    const rejected = cleanerTasks.filter((t) => t.status === "rejected").length;
    
    const compliance_rate = completed > 0 ? Math.round((onTime / completed) * 100) : 0;
    
    let totalDuration = 0;
    let durationCount = 0;
    cleanerTasks.forEach((t) => {
      if (t.started_at && t.completed_at) {
        const start = new Date(t.started_at);
        const end = new Date(t.completed_at);
        const diffMin = (end.getTime() - start.getTime()) / 60000;
        if (diffMin > 0) {
          totalDuration += diffMin;
          durationCount++;
        }
      }
    });
    const avg_execution_time_minutes = durationCount > 0 ? Math.round((totalDuration / durationCount) * 10) / 10 : 0;
    
    let qualitySum = 0;
    let gradedCount = 0;
    cleanerTasks.forEach((t) => {
      if (t.quality_grade) {
        gradedCount++;
        if (t.quality_grade === "A") qualitySum += 100;
        else if (t.quality_grade === "B") qualitySum += 80;
        else if (t.quality_grade === "C") qualitySum += 60;
      }
    });
    const quality_score = gradedCount > 0 ? Math.round(qualitySum / gradedCount) : 0;
    const supervisor_rating = quality_score > 0 ? (quality_score >= 90 ? 4.9 : quality_score >= 80 ? 4.5 : 3.8) : 0;
    
    return {
      profile_id: cleaner.id,
      cleaner_name: cleaner.full_name,
      username: cleaner.username,
      tasks_assigned: total,
      tasks_completed_on_time: onTime,
      tasks_late: late,
      tasks_reworked: reworked,
      tasks_rejected: rejected,
      compliance_rate,
      avg_execution_time_minutes,
      quality_score,
      supervisor_rating
    };
  });

  return kpisData.sort((a, b) => {
    // Primary sort: Quality Score
    if (b.quality_score !== a.quality_score) {
      return b.quality_score - a.quality_score;
    }
    // Secondary sort: Compliance Rate
    if (b.compliance_rate !== a.compliance_rate) {
      return b.compliance_rate - a.compliance_rate;
    }
    // Tertiary sort: Completed tasks on time
    return b.tasks_completed_on_time - a.tasks_completed_on_time;
  });
}

export async function getOperationalTasks(): Promise<(OperationalTask & { responsible_employee?: Profile })[]> {
  await ensureSeeded();
  if (cachedOperationalTasks) return cachedOperationalTasks;
  let opSnap;
  try {
    opSnap = await getDocs(collection(db, "operational_tasks"));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "operational_tasks");
  }
  const profiles = await getProfiles();
  
  const tasks: (OperationalTask & { responsible_employee?: Profile })[] = [];
  opSnap.forEach((docSnap) => {
    const ot = docSnap.data() as OperationalTask;
    const emp = profiles.find((p) => p.id === ot.responsible_employee_id);
    tasks.push({ ...ot, responsible_employee: emp });
  });
  cachedOperationalTasks = tasks;
  return tasks;
}

export async function getDeviceSwitches(): Promise<DeviceSwitch[]> {
  await ensureSeeded();
  if (cachedDeviceSwitches) return cachedDeviceSwitches;
  let snap;
  try {
    snap = await getDocs(collection(db, "device_switches"));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "device_switches");
  }
  const switches: DeviceSwitch[] = [];
  snap.forEach((docSnap) => {
    switches.push(docSnap.data() as DeviceSwitch);
  });
  cachedDeviceSwitches = switches;
  return switches;
}

export function compressImage(base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.6): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof Image === "undefined") {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };

    img.onerror = () => {
      resolve(base64Str);
    };

    img.src = base64Str;
  });
}


export function base64ToBlob(base64: string): Blob {
  const arr = base64.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function waitForUploadTask(task: UploadTask): Promise<string> {
  return new Promise((resolve, reject) => {
    const unsubscribe = task.on(
      "state_changed",
      () => {
        // Intentionally handled by the caller / component if needed.
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(task.snapshot.ref);
          unsubscribe();
          resolve(downloadUrl);
        } catch (err) {
          unsubscribe();
          reject(err);
        }
      }
    );
  });
}

export async function uploadPhotoTask(base64Image: string, path: string): Promise<{ task: UploadTask }> {
  const compressedBase64 = await compressImage(base64Image, 800, 800, 0.6);
  const blob = base64ToBlob(compressedBase64);
  const sRef = storageRef(storage, path);
  const task = uploadBytesResumable(sRef, blob);
  return { task };
}

export async function uploadPhoto(base64Image: string, path: string): Promise<string> {
  const { task } = await uploadPhotoTask(base64Image, path);
  return waitForUploadTask(task);
}

export async function deletePhoto(path: string): Promise<void> {
  try {
    const sRef = storageRef(storage, path);
    await deleteObject(sRef);
    console.log(`[Storage] Rollback successful: deleted ${path}`);
  } catch (err) {
    console.warn(`[Storage] Rollback failed: couldn't delete ${path}`, err);
  }
}

export async function resetDatabase(): Promise<void> {
  console.log("[Reset Database] Clearing local database and cache in localStorage...");
  
  // 1. Clear all data-related keys in localStorage to prevent syncing old or deleted data back
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("narisops_local_db");
    localStorage.removeItem("naris_local_db_synced_to_firestore");
    localStorage.removeItem("naris_pending_updates");
    localStorage.removeItem("naris_schema_version");
    localStorage.removeItem("naris_inventory_data");
    localStorage.removeItem("use_base64_storage");
    
    // Clear any task cache keys
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("naris_cached_tasks_") || key.startsWith("narisops_cached_") || key.startsWith("naris_ops_"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn("[Reset Database] Failed to clear cached task keys:", e);
    }
  }

  // Reset the in-memory localDB
  localDB = {
    users: {},
    locations: {},
    zones: {},
    task_templates: {},
    sop_items: {},
    task_instances: {},
    operational_tasks: {},
    notifications: {},
    device_switches: {},
    kpi_snapshots: {}
  };
  localDBInitialized = false;

  if (useLocalFallback) {
    initLocalDB();
    invalidateMetadataCaches();
    console.log("[Local DB] Local database cleared and re-seeded successfully.");
    return;
  }

  // 1. Backup existing zone cover images if any
  const zoneImageBackup: Record<string, string> = {};
  if (!useLocalFallback) {
    try {
      const zonesCol = collection(db, "zones");
      const snap = await getDocs(zonesCol);
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.cover_image_url) {
          zoneImageBackup[docSnap.id] = data.cover_image_url;
        }
      });
    } catch (e) {
      console.warn("[Reset Database] Failed to backup zone cover images:", e);
    }
  }

  const collectionsToClear = [
    "users",
    "locations",
    "zones",
    "task_templates",
    "task_instances",
    "operational_tasks",
    "notifications",
    "device_switches",
    "kpi_snapshots"
  ];

  console.log("[Firestore Client] Resetting and testing database...");
  for (const colName of collectionsToClear) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      for (const d of snapshot.docs) {
        await firebaseDeleteDoc(doc(db, colName, d.id));
      }
    } catch (err) {
      console.error(`[Firestore Client] Error clearing collection ${colName}:`, err);
    }
  }

  // Clear seeding promise and re-seed clean, compliant templates
  clearSeedingPromise();
  await ensureSeeded();

  // Restore backed up zone cover images
  if (Object.keys(zoneImageBackup).length > 0 && !useLocalFallback) {
    console.log("[Reset Database] Restoring backed up zone cover images...");
    for (const zId of Object.keys(zoneImageBackup)) {
      try {
        const docRef = doc(db, "zones", zId);
        const zDoc = await getDoc(docRef);
        if (zDoc.exists()) {
          await setDoc(docRef, { ...zDoc.data(), cover_image_url: zoneImageBackup[zId] });
        }
      } catch (e) {
        console.error(`[Reset Database] Failed to restore cover image for zone ${zId}:`, e);
      }
    }
  }

  invalidateMetadataCaches();
  console.log("[Firestore Client] Database cleared and re-seeded successfully.");
}

export async function reseedSopTemplatesAndResetTasks(): Promise<void> {
  console.log("[Reseed SOP] Clearing existing templates and tasks...");
  
  // 1. Clear caches
  invalidateMetadataCaches();
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("naris_sop_templates_synced_v34_fix");
    localStorage.removeItem("naris_sop_templates_synced");
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("naris_cached_tasks_") || key.startsWith("narisops_cached_") || key.startsWith("naris_ops_"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn("[Reseed SOP] Failed to clear cached keys:", e);
    }
  }

  // 2. Clear from memory localDB if using local fallback
  if (useLocalFallback) {
    const existingZoneImages: Record<string, string> = {};
    Object.keys(localDB.zones).forEach(zId => {
      if (localDB.zones[zId]?.cover_image_url) {
        existingZoneImages[zId] = localDB.zones[zId].cover_image_url;
      }
    });

    const existingTemplateImages: Record<string, { guide?: string; ref?: string }> = {};
    Object.keys(localDB.task_templates || {}).forEach(tId => {
      if (localDB.task_templates[tId]?.guide_image_url || localDB.task_templates[tId]?.reference_image_url) {
        existingTemplateImages[tId] = {
          guide: localDB.task_templates[tId].guide_image_url,
          ref: localDB.task_templates[tId].reference_image_url
        };
      }
    });

    localDB.task_templates = {};
    localDB.sop_items = {};
    localDB.task_instances = {};
    localDB.zones = {};
    const seeded = getSeededDB();
    seeded.task_templates.forEach((t: any) => {
      const backup = existingTemplateImages[t.id];
      const resItem = {
        ...t,
        guide_image_url: backup?.guide || t.guide_image_url || "",
        reference_image_url: backup?.ref || t.reference_image_url || ""
      };
      localDB.task_templates[t.id] = resItem;
      localDB.sop_items[t.id] = resItem;
    });
    seeded.zones.forEach((z) => {
      const restoredUrl = existingZoneImages[z.id] || z.cover_image_url || "";
      localDB.zones[z.id] = { ...z, cover_image_url: restoredUrl };
    });
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("narisops_local_db", JSON.stringify(localDB));
    }
    console.log("[Local DB] Local templates and zones re-seeded successfully with preserved images.");
    return;
  }

  // 3. Firestore delete and insert
  try {
    // Backup existing zone cover images if any before clearing
    const zoneImageBackup: Record<string, string> = {};
    try {
      const zonesCol = firebaseCollection(db, "zones");
      const snap = await firebaseGetDocs(zonesCol);
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.cover_image_url) {
          zoneImageBackup[docSnap.id] = data.cover_image_url;
        }
      });
    } catch (e) {
      console.warn("[Reseed SOP] Failed to backup zone cover images before clearing:", e);
    }

    // Backup existing template guide & reference images if any before clearing
    const templateImageBackup: Record<string, { guide?: string; ref?: string }> = {};
    try {
      const templatesCol = firebaseCollection(db, "task_templates");
      const snap = await firebaseGetDocs(templatesCol);
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data && (data.guide_image_url || data.reference_image_url)) {
          templateImageBackup[docSnap.id] = {
            guide: data.guide_image_url,
            ref: data.reference_image_url
          };
        }
      });

      // Also backup from sop_items if any
      const sopCol = firebaseCollection(db, "sop_items");
      const sopSnap = await firebaseGetDocs(sopCol);
      sopSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data && (data.guide_image_url || data.reference_image_url) && !templateImageBackup[docSnap.id]) {
          templateImageBackup[docSnap.id] = {
            guide: data.guide_image_url,
            ref: data.reference_image_url
          };
        }
      });
    } catch (e) {
      console.warn("[Reseed SOP] Failed to backup template images before clearing:", e);
    }

    // A. Delete existing task_instances
    const instancesCol = firebaseCollection(db, "task_instances");
    const instancesSnap = await firebaseGetDocs(instancesCol);
    for (const d of instancesSnap.docs) {
      await firebaseDeleteDoc(firebaseDoc(db, "task_instances", d.id));
    }
    console.log(`[Firestore Client] Cleared ${instancesSnap.size} task instances.`);

    // B. Delete existing task_templates and sop_items
    const templatesCol = firebaseCollection(db, "task_templates");
    const templatesSnap = await firebaseGetDocs(templatesCol);
    for (const d of templatesSnap.docs) {
      await firebaseDeleteDoc(firebaseDoc(db, "task_templates", d.id));
    }
    console.log(`[Firestore Client] Cleared ${templatesSnap.size} task templates.`);

    try {
      const sopCol = firebaseCollection(db, "sop_items");
      const sopSnap = await firebaseGetDocs(sopCol);
      for (const d of sopSnap.docs) {
        await firebaseDeleteDoc(firebaseDoc(db, "sop_items", d.id));
      }
      console.log(`[Firestore Client] Cleared ${sopSnap.size} SOP items.`);
    } catch (e) {
      console.warn("[Reseed SOP] Failed to clear sop_items:", e);
    }

    // C. Delete existing zones
    const zonesCol = firebaseCollection(db, "zones");
    const zonesSnap = await firebaseGetDocs(zonesCol);
    for (const d of zonesSnap.docs) {
      await firebaseDeleteDoc(firebaseDoc(db, "zones", d.id));
    }
    console.log(`[Firestore Client] Cleared ${zonesSnap.size} zones.`);

    // D. Seed zones and task_templates
    const seededDB = getSeededDB();
    const seededZones = seededDB.zones;
    const seededTemplates = seededDB.task_templates;

    console.log(`[Firestore Client] Inserting ${seededZones.length} clean zones with restored images if any...`);
    for (const zone of seededZones) {
      const restoredUrl = zoneImageBackup[zone.id] || zone.cover_image_url || "";
      const updatedZone = { ...zone, cover_image_url: restoredUrl };
      await firebaseSetDoc(firebaseDoc(db, "zones", zone.id), updatedZone);
    }

    console.log(`[Firestore Client] Inserting ${seededTemplates.length} clean templates and SOP items...`);
    for (const template of seededTemplates as any[]) {
      const backup = templateImageBackup[template.id];
      const updatedTemplate = {
        ...template,
        guide_image_url: backup?.guide || template.guide_image_url || "",
        reference_image_url: backup?.ref || template.reference_image_url || ""
      };
      await firebaseSetDoc(firebaseDoc(db, "task_templates", template.id), updatedTemplate);
      await firebaseSetDoc(firebaseDoc(db, "sop_items", template.id), updatedTemplate);
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("naris_sop_templates_synced_v34_fix", "true");
    }
    
    console.log("[Reseed SOP] Reseed and sync completed successfully!");
  } catch (err) {
    console.error("[Reseed SOP] Failed to reseed templates/tasks in Firestore:", err);
    throw err;
  }
}

export interface DatabaseValidationReport {
  timestamp: string;
  isPassed: boolean;
  summary: {
    totalCollectionsChecked: number;
    totalDocumentsChecked: number;
    totalErrors: number;
    totalWarnings: number;
  };
  details: {
    collectionName: string;
    totalDocs: number;
    passedDocs: number;
    failedDocs: number;
    errors: string[];
    warnings: string[];
  }[];
}

export async function validateDatabase(): Promise<DatabaseValidationReport> {
  await ensureSeeded();
  console.log("[Firestore Client] Starting Database Validation...");

  const report: DatabaseValidationReport = {
    timestamp: new Date().toISOString(),
    isPassed: true,
    summary: {
      totalCollectionsChecked: 0,
      totalDocumentsChecked: 0,
      totalErrors: 0,
      totalWarnings: 0,
    },
    details: []
  };

  const collectionsToCheck = [
    { name: "users", label: "الموظفين والحسابات (users/profiles)" },
    { name: "locations", label: "المواقع الجغرافية (locations)" },
    { name: "zones", label: "المناطق والأقسام (zones)" },
    { name: "task_templates", label: "القوالب المعيارية (task_templates)" },
    { name: "sop_items", label: "بنود SOP المعيارية (sop_items)" },
    { name: "task_instances", label: "مهام العمل والتشغيل (task_instances)" },
    { name: "operational_tasks", label: "المهام التشغيلية (operational_tasks)" }
  ];

  for (const col of collectionsToCheck) {
    const detail = {
      collectionName: col.label,
      totalDocs: 0,
      passedDocs: 0,
      failedDocs: 0,
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      const snap = await getDocs(collection(db, col.name));
      detail.totalDocs = snap.size;
      report.summary.totalCollectionsChecked++;
      report.summary.totalDocumentsChecked += snap.size;

      snap.forEach((docSnap) => {
        const id = docSnap.id;
        const data = docSnap.data();
        let docHasError = false;

        // 1. Generic ID check
        if (!data.id) {
          detail.errors.push(`المستند [${id}]: حقل المعرف الموحد 'id' مفقود في الداتابيز.`);
          docHasError = true;
        } else if (data.id !== id) {
          detail.warnings.push(`المستند [${id}]: معرف المستند لا يطابق حقل id الداخلي (${data.id}).`);
        }

        // 2. Collection specific checks
        if (col.name === "users") {
          // Profile validation
          if (!data.full_name) {
            detail.errors.push(`المستخدم [${id}]: الاسم الكامل 'full_name' مفقود.`);
            docHasError = true;
          }
          if (!data.username) {
            detail.errors.push(`المستخدم [${id}]: اسم المستخدم 'username' مفقود.`);
            docHasError = true;
          }
          if (!data.role || !["admin", "cleaner", "supervisor"].includes(data.role)) {
            detail.errors.push(`المستخدم [${id}]: الصلاحية 'role' مفقودة أو غير صالحة (${data.role}).`);
            docHasError = true;
          }
        } 
        
        else if (col.name === "locations") {
          if (!data.name) {
            detail.errors.push(`الموقع [${id}]: الاسم 'name' مفقود.`);
            docHasError = true;
          }
        } 
        
        else if (col.name === "zones") {
          if (!data.location_id) {
            detail.errors.push(`المنطقة [${id}]: معرف الموقع 'location_id' مفقود.`);
            docHasError = true;
          }
          if (!data.name) {
            detail.errors.push(`المنطقة [${id}]: الاسم 'name' مفقود.`);
            docHasError = true;
          }
        } 
        
        else if (col.name === "task_templates" || col.name === "sop_items") {
          if (!data.zone_id) {
            detail.errors.push(`البند [${id}]: معرف المنطقة 'zone_id' مفقود.`);
            docHasError = true;
          }
          if (!data.task_code) {
            detail.errors.push(`البند [${id}]: رمز المهمة 'task_code' مفقود.`);
            docHasError = true;
          }
          if (!data.title) {
            detail.errors.push(`البند [${id}]: العنوان 'title' مفقود.`);
            docHasError = true;
          }
          if (data.requires_photo_before === undefined) {
            detail.warnings.push(`البند [${id}]: حقل 'requires_photo_before' غير معرف (يفترض false).`);
          }
          if (data.requires_photo_after === undefined) {
            detail.warnings.push(`البند [${id}]: حقل 'requires_photo_after' غير معرف (يفترض false).`);
          }
        } 
        
        else if (col.name === "task_instances") {
          // Task Instance validation
          if (!data.zone_id) {
            detail.errors.push(`مهمة [${id}]: معرف المنطقة 'zone_id' مفقود.`);
            docHasError = true;
          }
          if (!data.assigned_to) {
            detail.errors.push(`مهمة [${id}]: الموظف المسؤول 'assigned_to' مفقود.`);
            docHasError = true;
          }
          if (!data.title) {
            detail.errors.push(`مهمة [${id}]: العنوان 'title' مفقود.`);
            docHasError = true;
          }
          if (!data.due_date) {
            detail.errors.push(`مهمة [${id}]: تاريخ الاستحقاق 'due_date' مفقود.`);
            docHasError = true;
          }
          if (!data.status) {
            detail.errors.push(`مهمة [${id}]: الحالة 'status' مفقودة.`);
            docHasError = true;
          }

          // Strict validation of required images (photo_before_url and photo_after_url)
          const hasBeforePhoto = !!(data.photo_before_url || data.before_image_url);
          const hasAfterPhoto = !!(data.photo_after_url || data.after_image_url);

          if (data.requires_photo_before && data.status === "completed" && !hasBeforePhoto) {
            detail.errors.push(`مهمة مكتملة [${id} - ${data.title}]: تتطلب صورة قبل التنظيف ولكن الحقل فارغ.`);
            docHasError = true;
          }
          if (data.requires_photo_after && data.status === "completed" && !hasAfterPhoto) {
            detail.errors.push(`مهمة مكتملة [${id} - ${data.title}]: تتطلب صورة بعد التنظيف ولكن الحقل فارغ.`);
            docHasError = true;
          }

          // Log warning if non-matching property name is used
          if (data.before_image_url && !data.photo_before_url) {
            detail.warnings.push(`مهمة [${id}]: تم استخدام 'before_image_url' بدلاً من 'photo_before_url' القياسي.`);
          }
          if (data.after_image_url && !data.photo_after_url) {
            detail.warnings.push(`مهمة [${id}]: تم استخدام 'after_image_url' بدلاً من 'photo_after_url' القياسي.`);
          }
        } 
        
        else if (col.name === "operational_tasks") {
          if (!data.zone_id) {
            detail.errors.push(`مهمة تشغيلية [${id}]: معرف المنطقة 'zone_id' مفقود.`);
            docHasError = true;
          }
          if (!data.title) {
            detail.errors.push(`مهمة تشغيلية [${id}]: العنوان 'title' مفقود.`);
            docHasError = true;
          }
        } 


        if (docHasError) {
          detail.failedDocs++;
        } else {
          detail.passedDocs++;
        }
      });

    } catch (err: any) {
      detail.errors.push(`خطأ عام أثناء فحص المجموعة: ${err?.message || err}`);
      report.isPassed = false;
    }

    report.summary.totalErrors += detail.errors.length;
    report.summary.totalWarnings += detail.warnings.length;
    if (detail.errors.length > 0) {
      report.isPassed = false;
    }
    report.details.push(detail);
  }

  return report;
}

export interface RecoveryLogItem {
  id: string;
  type: "zone" | "task";
  name: string;
  action: "restored_missing" | "merged_updates" | "no_change_needed" | "error";
  details: string;
  timestamp: string;
}

export async function recoverAndReconcileLocalData(): Promise<RecoveryLogItem[]> {
  const log: RecoveryLogItem[] = [];
  const nowStr = new Date().toISOString();

  try {
    console.log("[Data Recovery] Querying Firestore for existing zones...");
    const zonesSnap = await getDocs(collection(db, "zones"));
    const existingZoneIds = new Set<string>();
    const existingZones: Record<string, any> = {};
    zonesSnap.forEach(docSnap => {
      existingZoneIds.add(docSnap.id);
      existingZones[docSnap.id] = docSnap.data();
    });

    const localZonesMap: Record<string, any> = {};
    
    // Seeded zones defaults
    const seeded = getSeededDB();
    seeded.zones.forEach(z => {
      localZonesMap[z.id] = z;
    });

    // Merge zones from localDB
    if (localDB && localDB.zones) {
      Object.keys(localDB.zones).forEach(id => {
        localZonesMap[id] = { ...localZonesMap[id], ...localDB.zones[id] };
      });
    }

    // Process zone restoration
    for (const [zoneId, zone] of Object.entries(localZonesMap)) {
      if (!existingZoneIds.has(zoneId)) {
        try {
          await setDoc(doc(db, "zones", zoneId), zone);
          if (localDB && localDB.zones) {
            localDB.zones[zoneId] = zone;
          }
          log.push({
            id: zoneId,
            type: "zone",
            name: zone.name || zoneId,
            action: "restored_missing",
            details: `تم استعادة المنطقة '${zone.name || zoneId}' إلى السيرفر بنجاح للتصحيح التلقائي.`,
            timestamp: nowStr
          });
        } catch (err: any) {
          log.push({
            id: zoneId,
            type: "zone",
            name: zone.name || zoneId,
            action: "error",
            details: `فشل استعادة المنطقة: ${err.message || err}`,
            timestamp: nowStr
          });
        }
      } else {
        const serverZone = existingZones[zoneId];
        if (!serverZone.name || !serverZone.id) {
          try {
            await setDoc(doc(db, "zones", zoneId), zone);
            log.push({
              id: zoneId,
              type: "zone",
              name: zone.name || zoneId,
              action: "merged_updates",
              details: "تم دمج ومعالجة الحقول غير المكتملة للمنطقة على السيرفر.",
              timestamp: nowStr
            });
          } catch (err: any) {
            console.error(`Failed to repair zone ${zoneId}`, err);
          }
        }
      }
    }

    // Task Reconciliation
    console.log("[Data Recovery] Querying Firestore for existing task instances...");
    const taskInstancesSnap = await getDocs(collection(db, "task_instances"));
    const existingTaskIds = new Set<string>();
    const existingTasks: Record<string, any> = {};
    taskInstancesSnap.forEach(docSnap => {
      existingTaskIds.add(docSnap.id);
      existingTasks[docSnap.id] = docSnap.data();
    });

    const localTasksMap: Record<string, any> = {};

    if (localDB && localDB.task_instances) {
      Object.keys(localDB.task_instances).forEach(id => {
        localTasksMap[id] = localDB.task_instances[id];
      });
    }

    if (typeof localStorage !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("naris_cached_tasks_")) {
          try {
            const dataStr = localStorage.getItem(key);
            if (dataStr) {
              const parsedTasks = JSON.parse(dataStr);
              if (Array.isArray(parsedTasks)) {
                parsedTasks.forEach(task => {
                  if (task && task.id) {
                    const existingLocal = localTasksMap[task.id];
                    if (!existingLocal || (task.updated_at && (!existingLocal.updated_at || task.updated_at > existingLocal.updated_at))) {
                      localTasksMap[task.id] = task;
                    }
                  }
                });
              }
            }
          } catch (err) {
            console.warn("Failed parsing cached task key during recovery:", key, err);
          }
        }
      }
    }

    for (const [taskId, localTask] of Object.entries(localTasksMap)) {
      if (!existingTaskIds.has(taskId)) {
        try {
          await setDoc(doc(db, "task_instances", taskId), localTask);
          if (localDB && localDB.task_instances) {
            localDB.task_instances[taskId] = localTask;
          }
          log.push({
            id: taskId,
            type: "task",
            name: localTask.title || taskId,
            action: "restored_missing",
            details: `تم العثور على مهمة محلية مفقودة على السيرفر (حالة: ${localTask.status}). تم رفعها واستعادتها بالكامل.`,
            timestamp: nowStr
          });
        } catch (err: any) {
          log.push({
            id: taskId,
            type: "task",
            name: localTask.title || taskId,
            action: "error",
            details: `فشل إعادة مزامنة المهمة المفقودة: ${err.message || err}`,
            timestamp: nowStr
          });
        }
      } else {
        const serverTask = existingTasks[taskId];
        const isLocalCompleted = localTask.status === "completed" && serverTask.status !== "completed";
        const isLocalInProgress = localTask.status === "in_progress" && serverTask.status === "pending";
        const isLocalNewer = localTask.updated_at && serverTask.updated_at && localTask.updated_at > serverTask.updated_at;

        if (isLocalCompleted || isLocalInProgress || isLocalNewer) {
          try {
            const mergedTask = {
              ...serverTask,
              ...localTask,
              updated_at: nowStr
            };
            await setDoc(doc(db, "task_instances", taskId), mergedTask);
            if (localDB && localDB.task_instances) {
              localDB.task_instances[taskId] = mergedTask;
            }
            log.push({
              id: taskId,
              type: "task",
              name: localTask.title || taskId,
              action: "merged_updates",
              details: `تم دمج تحديثات محلية أحدث لحالة المهمة بنجاح (الحالة المحلية: ${localTask.status}).`,
              timestamp: nowStr
            });
          } catch (err: any) {
            log.push({
              id: taskId,
              type: "task",
              name: localTask.title || taskId,
              action: "error",
              details: `فشل دمج تحديثات المهمة: ${err.message || err}`,
              timestamp: nowStr
            });
          }
        }
      }
    }

    if (typeof localStorage !== "undefined" && localDB) {
      localStorage.setItem("narisops_local_db", JSON.stringify(localDB));
    }

    await syncOfflineTasks();

  } catch (err: any) {
    console.error("[Data Recovery] Fatal error during reconciliation:", err);
    log.push({
      id: "fatal_system",
      type: "task",
      name: "محرك المعالجة التلقائية",
      action: "error",
      details: `حدث خطأ عام غير متوقع أثناء الفحص والاستعادة: ${err.message || err}`,
      timestamp: nowStr
    });
  }

  return log;
}

export interface ImageRecoveryLogItem {
  id: string;
  zoneName: string;
  sourceKey: string;
  imageUrl: string;
  status: "restored" | "already_exists" | "skipped";
}

export async function recoverZoneImagesFromCaches(): Promise<ImageRecoveryLogItem[]> {
  const recovered: ImageRecoveryLogItem[] = [];
  if (typeof localStorage === "undefined") return recovered;

  const seeded = getSeededDB();
  const zoneIds = seeded.zones.map(z => z.id);
  const zoneNames = seeded.zones.reduce((acc, z) => ({ ...acc, [z.id]: z.name }), {} as Record<string, string>);

  initLocalDB();
  const activeZones = { ...localDB.zones };

  let firestoreZones: Record<string, any> = {};
  if (!useLocalFallback) {
    try {
      const snap = await getDocs(collection(db, "zones"));
      snap.forEach(docSnap => {
        firestoreZones[docSnap.id] = docSnap.data();
      });
    } catch (e) {
      console.warn("Could not load firestore zones during image recovery:", e);
    }
  }

  const saveRecovered = async (zId: string, imgUrl: string, keyName: string) => {
    if (!localDB.zones[zId]) {
      localDB.zones[zId] = { id: zId, ...getSeededDB().zones.find(z => z.id === zId) };
    }
    localDB.zones[zId].cover_image_url = imgUrl;
    saveLocalDB();

    if (!useLocalFallback) {
      try {
        const docRef = doc(db, "zones", zId);
        const activeSnap = await getDoc(docRef);
        const activeData = activeSnap.exists() ? activeSnap.data() : { id: zId, ...getSeededDB().zones.find(z => z.id === zId) };
        await setDoc(docRef, { ...activeData, cover_image_url: imgUrl });
      } catch (err) {
        console.warn(`[Image Recovery] Failed to sync recovered image for ${zId} to Firestore:`, err);
      }
    }

    recovered.push({
      id: zId,
      zoneName: zoneNames[zId] || zId,
      sourceKey: keyName,
      imageUrl: imgUrl,
      status: "restored"
    });

    activeZones[zId] = { ...activeZones[zId], cover_image_url: imgUrl };
    firestoreZones[zId] = { ...firestoreZones[zId], cover_image_url: imgUrl };
  };

  // 1. Scan localStorage for any JSON value that looks like our database structures or custom templates containing cover_image_url
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key === "naris_ops_session" || key === "naris_ops_user") continue;

    try {
      const value = localStorage.getItem(key);
      if (!value) continue;

      if (value.startsWith("{") || value.startsWith("[")) {
        const parsed = JSON.parse(value);
        
        const searchInObject = async (obj: any, keyName: string) => {
          if (!obj || typeof obj !== "object") return;

          if (obj.id && zoneIds.includes(obj.id) && obj.cover_image_url) {
            const zId = obj.id;
            const imgUrl = obj.cover_image_url;
            const currentActiveImg = activeZones[zId]?.cover_image_url || firestoreZones[zId]?.cover_image_url || "";
            if (!currentActiveImg && imgUrl) {
              await saveRecovered(zId, imgUrl, keyName);
            }
          }

          if (obj.zones && typeof obj.zones === "object") {
            for (const zId of Object.keys(obj.zones)) {
              if (zoneIds.includes(zId) && obj.zones[zId]?.cover_image_url) {
                const imgUrl = obj.zones[zId].cover_image_url;
                const currentActiveImg = activeZones[zId]?.cover_image_url || firestoreZones[zId]?.cover_image_url || "";
                if (!currentActiveImg && imgUrl) {
                  await saveRecovered(zId, imgUrl, keyName);
                }
              }
            }
          }

          for (const k of Object.keys(obj)) {
            if (obj[k] && typeof obj[k] === "object") {
              await searchInObject(obj[k], keyName);
            }
          }
        };

        await searchInObject(parsed, key);
      }
    } catch (err) {
      // Ignore parse/traversal errors
    }
  }

  // 2. Scan for specific standalone zone image backups
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("naris_zone_image_")) {
      const zId = key.replace("naris_zone_image_", "");
      if (zoneIds.includes(zId)) {
        const imgUrl = localStorage.getItem(key);
        if (imgUrl) {
          const currentActiveImg = activeZones[zId]?.cover_image_url || firestoreZones[zId]?.cover_image_url || "";
          if (!currentActiveImg) {
            await saveRecovered(zId, imgUrl, key);
          }
        }
      }
    }
  }

  return recovered;
}

export interface ImageSyncResult {
  id: string;
  zoneName: string;
  status: "success" | "skipped" | "error";
  details: string;
}

export async function syncLocalZoneImagesToCloud(): Promise<ImageSyncResult[]> {
  const results: ImageSyncResult[] = [];
  initLocalDB();

  const seeded = getSeededDB();
  const zoneNames = seeded.zones.reduce((acc, z) => ({ ...acc, [z.id]: z.name }), {} as Record<string, string>);

  const localZones = { ...localDB.zones };

  for (const zId of Object.keys(localZones)) {
    const zone = localZones[zId];
    if (zone && zone.cover_image_url && zone.cover_image_url.startsWith("data:image/")) {
      try {
        console.log(`[Image Sync] Syncing local base64 image for zone ${zId} to Cloud Storage...`);
        const storagePath = `zones/${zId}/cover_synced_${Date.now()}.jpg`;
        const uploadedUrl = await uploadPhoto(zone.cover_image_url, storagePath);

        zone.cover_image_url = uploadedUrl;
        await saveZone({
          id: zId,
          cover_image_url: uploadedUrl
        });

        localStorage.setItem(`naris_zone_image_${zId}`, uploadedUrl);

        results.push({
          id: zId,
          zoneName: zoneNames[zId] || zone.name || zId,
          status: "success",
          details: "تم رفع الصورة وضغطها وتعيين رابطها السحابي الدائم بنجاح بنسبة 100%."
        });
      } catch (err: any) {
        console.error(`[Image Sync] Failed to sync zone ${zId} cover image:`, err);
        results.push({
          id: zId,
          zoneName: zoneNames[zId] || zone.name || zId,
          status: "error",
          details: `فشل الرفع السحابي: ${err.message || err}`
        });
      }
    }
  }

  return results;
}
