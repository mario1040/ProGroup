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
import { uploadToCloudinary } from "./cloudinary";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getAuth
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { getSeededDB } from "../db_default";
import { isOnline } from "./offlineManager";
import {
  recordFirestoreError,
  clearFirestoreQuotaWarning,
  isFirestoreQuotaError,
  getFirestoreQuotaExceeded,
  setFirestoreQuotaExceeded,
  subscribeFirestoreQuota,
  useFirestoreQuota
} from "./quotaManager";

export {
  recordFirestoreError,
  clearFirestoreQuotaWarning,
  isFirestoreQuotaError,
  getFirestoreQuotaExceeded,
  setFirestoreQuotaExceeded,
  subscribeFirestoreQuota,
  useFirestoreQuota
};

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
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
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
  }
} catch (e) {
  console.warn("localStorage is not accessible during project check:", e);
}

let useLocalFallback = false; // Online-only production: local fallback permanently disabled

// --- Memory Cache for Metadata to Reduce Firestore Reads with TTL Freshness ---
const METADATA_CACHE_TTL_MS = 30 * 1000; // 30 seconds TTL for fast freshness across multiple tabs/devices

let cachedProfiles: { data: Profile[]; timestamp: number } | null = null;
let cachedTemplates: { data: TaskTemplate[]; timestamp: number } | null = null;
let cachedSopItems: { data: SOPItem[]; timestamp: number } | null = null;
let cachedZones: { data: Zone[]; timestamp: number } | null = null;
let cachedOperationalTasks: { data: any[]; timestamp: number } | null = null;
let cachedDeviceSwitches: { data: DeviceSwitch[]; timestamp: number } | null = null;

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
      const keys: (keyof typeof localDB)[] = ["users", "locations", "zones", "task_templates", "sop_items", "task_instances", "operational_tasks", "device_switches", "kpi_snapshots"];
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

      // Reconcile only profiles explicitly marked inactive in the current seed.
      // Never auto-reactivate an existing account or reset a production password.
      let localUsersChanged = false;
      const seededInactiveProfiles = seeded.profiles.filter((profile) => profile.is_active === false);
      for (const seededProfile of seededInactiveProfiles) {
        const localEntry = Object.values(localDB.users).find((userObj: any) =>
          userObj?.id === seededProfile.id ||
          userObj?.username?.trim().toLowerCase() === seededProfile.username.trim().toLowerCase()
        );
        if (localEntry && localEntry.is_active !== false) {
          console.warn(`[Profile Migration] Marking seeded inactive profile as inactive: ${seededProfile.username}`);
          localEntry.is_active = false;
          localUsersChanged = true;
        }
      }

      if (localTemplatesChanged || localUsersChanged) {
        console.log("[Local DB] Auto-purged obsolete templates and reconciled seeded inactive profiles.");
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
  seeded.device_switches.forEach(sw => { localDB.device_switches[sw.id] = sw; });
  seeded.kpi_snapshots.forEach(k => { localDB.kpi_snapshots[k.id] = k; });

  saveLocalDB();
  localDBInitialized = true;
}

function pruneLocalDBInstances(): boolean {
  if (!localDB || !localDB.task_instances) return false;

  let changed = false;
  const ids = Object.keys(localDB.task_instances);
  for (const id of ids) {
    const task = localDB.task_instances[id];
    if (!task) continue;

    // Strip base64 guide/reference images from task instances (they will fall back to template)
    if (task.guide_image_url && task.guide_image_url.startsWith("data:")) {
      task.guide_image_url = "";
      changed = true;
    }
    if (task.reference_image_url && task.reference_image_url.startsWith("data:")) {
      task.reference_image_url = "";
      changed = true;
    }
  }

  return changed;
}

function saveLocalDB() {
  try {
    pruneLocalDBInstances();
    localStorage.setItem("narisops_local_db", JSON.stringify(localDB));
  } catch (e: any) {
    console.warn("[Local DB] setItem failed:", e);
  }
}

function triggerLocalFallback(error: any) {
  console.warn("[Local Fallback] Firestore error logged but local fallback is disabled in online-only mode:", error);
}

export function isUsingLocalFallback(): boolean {
  return useLocalFallback;
}

export function setLocalFallback(value: boolean) {
  useLocalFallback = value;
  try {
    localStorage.setItem("use_local_fallback", value ? "true" : "false");
  } catch (e) { }
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
    clearFirestoreQuotaWarning();
    return snap;
  } catch (err: any) {
    recordFirestoreError(err);
    triggerLocalFallback(err);
    throw err;
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
    clearFirestoreQuotaWarning();
    return snap;
  } catch (err: any) {
    recordFirestoreError(err);
    triggerLocalFallback(err);
    throw err;
  }
}

export async function setDoc(docRef: any, data: any, options?: any) {
  const cleaned = cleanUndefined(data);

  try {
    await firebaseSetDoc(docRef, cleaned, options);
    clearFirestoreQuotaWarning();
  } catch (err: any) {
    recordFirestoreError(err);
    triggerLocalFallback(err);
    throw err;
  }
}

export async function updateDoc(docRef: any, data: any) {
  const cleaned = cleanUndefined(data);

  try {
    await firebaseUpdateDoc(docRef, cleaned);
    clearFirestoreQuotaWarning();
  } catch (err: any) {
    recordFirestoreError(err);
    triggerLocalFallback(err);
    throw err;
  }
}

export async function deleteDoc(docRef: any) {
  try {
    await firebaseDeleteDoc(docRef);
    clearFirestoreQuotaWarning();
  } catch (err: any) {
    recordFirestoreError(err);
    triggerLocalFallback(err);
    throw err;
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
    const realUnsubscribe = firebaseOnSnapshot(
      q,
      (snap) => {
        clearFirestoreQuotaWarning();
        callback(snap);
      },
      (err) => {
        recordFirestoreError(err);
        if (errorCallback) errorCallback(err);
      }
    );
    return realUnsubscribe;
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
  console.log("[Sync Engine] Local-to-Firestore sync is disabled in online-only production mode.");
  return;
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

      if (!usersSnap.empty) {

        // One-way reconciliation for profiles explicitly inactive in the current seed.
        // Never reactivate an existing account and never reset a production password here.
        try {
          const seededInactiveProfiles = getSeededDB().profiles.filter((profile) => profile.is_active === false);
          const inactiveProfileMigrations = usersSnap.docs.map(async (docSnap) => {
            const userData = docSnap.data() as Profile;
            const seededInactiveProfile = seededInactiveProfiles.find((profile) =>
              profile.id === docSnap.id ||
              profile.username.trim().toLowerCase() === userData.username?.trim().toLowerCase()
            );

            if (seededInactiveProfile && userData.is_active !== false) {
              console.warn(`[Profile Migration] Marking profile inactive: ${seededInactiveProfile.username}`);
              await firebaseUpdateDoc(firebaseDoc(db, "users", docSnap.id), {
                is_active: false
              });
              return true;
            }
            return false;
          });

          const migrated = await Promise.all(inactiveProfileMigrations);
          if (migrated.some(Boolean)) {
            invalidateMetadataCaches();
          }
        } catch (migrationError) {
          console.warn("[Profile Migration] Failed to reconcile seeded inactive profiles:", migrationError);
        }

        return;
      }

      console.log("[Firestore Client] Firestore is empty. Seeding initial default data across collections...");
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

      // 4. Seed task templates
      for (const tpl of seeded.task_templates) {
        await setDoc(doc(db, "task_templates", tpl.id), tpl);
      }

      // 5. Seed task_instances
      for (const ti of seeded.task_instances) {
        await setDoc(doc(db, "task_instances", ti.id), ti);
      }

      // 6. Seed operational_tasks
      for (const ot of seeded.operational_tasks) {
        await setDoc(doc(db, "operational_tasks", ot.id), ot);
      }

      // 7. Seed device_switches
      for (const sw of seeded.device_switches) {
        await setDoc(doc(db, "device_switches", sw.id), sw);
      }

      // 8. Seed kpi_snapshots
      for (const k of seeded.kpi_snapshots) {
        await setDoc(doc(db, "kpi_snapshots", k.id), k);
      }

      console.log("[Firestore Client] Seeding completed successfully.");
    } catch (err) {
      console.error("[Firestore Client] Seeding failed:", err);
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

// --- Recurrence Engine Helpers ---

export function getSopOccurrencesForDate(sop: SOPItem, dateStr: string): { time: string; occurrenceIndex: number }[] {
  if (!sop.is_active) return [];
  const dayNameAr = getArabicDayName(dateStr);
  const occurrences: { time: string; occurrenceIndex: number }[] = [];
  const times: string[] = [];
  if (sop.scheduled_times && sop.scheduled_times.length > 0) {
    times.push(...sop.scheduled_times);
  } else if (sop.scheduled_time) {
    times.push(sop.scheduled_time);
  } else {
    times.push("09:00");
  }
  switch (sop.frequency) {
    case "يومي":
      times.forEach((time, idx) => occurrences.push({ time, occurrenceIndex: idx }));
      break;
    case "يوم ويوم":
    case "يوم و يوم":
      const createdDateStr = sop.created_at ? sop.created_at.split("T")[0] : "2026-07-01";
      if (getDaysDiff(createdDateStr, dateStr) % 2 === 0) {
        times.forEach((time, idx) => occurrences.push({ time, occurrenceIndex: idx }));
      }
      break;
    case "أسبوعي":
    case "مرتين أسبوعيا":
    case "ثلاث مرات أسبوعيا":
      if (sop.recurrence_days && sop.recurrence_days.includes(dayNameAr)) {
        times.forEach((time, idx) => occurrences.push({ time, occurrenceIndex: idx }));
      }
      break;
    case "ثلاث مرات يوميا":
      times.forEach((time, idx) => occurrences.push({ time, occurrenceIndex: idx }));
      break;
    default:
      return [];
  }
  return occurrences;
}

export function generateTaskInstanceId(sopId: string, dateStr: string, occurrenceIndex: number): string {
  return `ti_rec_${sopId}_${dateStr}_${occurrenceIndex}`;
}

export function buildTaskInstanceSnapshot(
  sop: SOPItem,
  dateStr: string,
  occurrence: { time: string; occurrenceIndex: number },
  assignedTo: string
): TaskInstance {
  return {
    id: generateTaskInstanceId(sop.id, dateStr, occurrence.occurrenceIndex),
    template_id: sop.id,
    sop_item_id: sop.id,
    zone_id: sop.zone_id,
    assigned_to: assignedTo,
    assigned_by: "p1",
    task_type: "recurring",
    title: sop.title,
    description: sop.description || "",
    goal: sop.goal || "",
    task_code: sop.task_code || "",
    category: sop.category || "تشغيل",
    tools_required: sop.tools_required || "",
    estimated_duration_minutes: sop.estimated_duration_minutes || 0,
    due_date: dateStr,
    due_time: occurrence.time,
    status: "pending",
    supervisor_approved: false,
    guide_image_url: sop.guide_image_url || "",
    reference_image_url: sop.reference_image_url || "",
    requires_photo_before: sop.requires_photo_before ?? true,
    requires_photo_after: sop.requires_photo_after ?? true,
    requires_supervisor_approval: sop.requires_supervisor_approval ?? true,
    requires_gps: sop.requires_gps ?? false,
    requires_signature: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
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
    profile = users.find((p) => p.role === "admin" && p.is_active === true);
  }

  if (!profile) {
    throw new Error("الموظف غير مسجل أو غير نشط في النظام");
  }

  if (profile.is_active !== true) {
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

  if (found && found.is_active !== true) {
    return null;
  }

  return found;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function getProfiles(): Promise<Profile[]> {
  await ensureSeeded();
  const now = Date.now();
  if (cachedProfiles && now - cachedProfiles.timestamp < METADATA_CACHE_TTL_MS) {
    return cachedProfiles.data;
  }
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
  cachedProfiles = { data: profiles, timestamp: now };
  return profiles;
}

export function isEligibleCleaner(profile: Profile | Partial<Profile>): boolean {
  return profile.role === "cleaner" && profile.is_active === true;
}

/**
 * Normalize legacy and current task photo schemas for every consumer.
 * Current records use photo_before_url/photo_after_url, while older records
 * may still store the same URLs under photos.before/photos.after.
 * Current fields always win when both formats are present.
 */
export function normalizeTaskPhotoUrls<T extends TaskInstance>(task: T): T {
  const beforeUrl = task.photo_before_url || task.photos?.before;
  const afterUrl = task.photo_after_url || task.photos?.after;

  return {
    ...task,
    photo_before_url: beforeUrl || undefined,
    photo_after_url: afterUrl || undefined,
  };
}

export function getEligibleCleaners(profiles: Profile[]): Profile[] {
  return profiles.filter((p) => isEligibleCleaner(p));
}

export function selectFlexibleAssignee(
  eligibleCleaners: Profile[],
  existingInstances: TaskInstance[],
  dateStr?: string
): Profile {
  if (!eligibleCleaners || eligibleCleaners.length === 0) {
    throw new Error("لا يوجد موظفون نشطون متاحون لإسناد المهمة.");
  }

  let bestCleaner = eligibleCleaners[0];
  let minTasks = Infinity;

  for (const cleaner of eligibleCleaners) {
    const taskCount = existingInstances.filter(
      (ti) => ti.assigned_to === cleaner.id && (!dateStr || ti.due_date === dateStr)
    ).length;

    if (taskCount < minTasks) {
      minTasks = taskCount;
      bestCleaner = cleaner;
    } else if (taskCount === minTasks && cleaner.id < bestCleaner.id) {
      // Deterministic tie-breaker
      bestCleaner = cleaner;
    }
  }

  return bestCleaner;
}

/**
 * Reassigns pending tasks owned by an inactive cleaner to eligible active cleaners.
 *
 * This is intentionally an explicit administrative repair operation rather than part
 * of getTasks() or the realtime listener. Historical/completed tasks are untouched,
 * and updateTask() performs the final active-cleaner validation before each write.
 */
export async function reassignPendingTasksFromInactiveCleaner(
  inactiveCleanerId: string
): Promise<{ updated: number; skipped: number }> {
  await ensureSeeded();

  if (!inactiveCleanerId || inactiveCleanerId.trim() === "") {
    throw new Error("معرف الموظف غير النشط مطلوب.");
  }

  const profiles = await getProfiles();
  const inactiveCleaner = profiles.find((profile) => profile.id === inactiveCleanerId);

  if (!inactiveCleaner || inactiveCleaner.role !== "cleaner" || inactiveCleaner.is_active === true) {
    throw new Error("الموظف المحدد ليس cleaner غير نشط.");
  }

  // Query by assignee only and filter status locally to avoid requiring a composite index.
  const assignedSnap = await getDocs(
    query(collection(db, "task_instances"), where("assigned_to", "==", inactiveCleanerId))
  );

  const pendingTasks: TaskInstance[] = [];
  assignedSnap.forEach((docSnap) => {
    const task = docSnap.data() as TaskInstance;
    if (task.status === "pending") {
      pendingTasks.push({ ...task, id: task.id || docSnap.id });
    }
  });

  if (pendingTasks.length === 0) {
    return { updated: 0, skipped: 0 };
  }

  const activeCleaners = getEligibleCleaners(profiles);
  if (activeCleaners.length === 0) {
    throw new Error("لا يوجد موظفون نشطون متاحون لإعادة إسناد المهام.");
  }

  // Workload is calculated per due date and updated locally after each reassignment.
  const dueDates = [...new Set(pendingTasks.map((task) => task.due_date).filter(Boolean))];
  const workloadTasks: TaskInstance[] = [];

  for (const dueDate of dueDates) {
    const daySnap = await getDocs(
      query(collection(db, "task_instances"), where("due_date", "==", dueDate))
    );
    daySnap.forEach((docSnap) => {
      workloadTasks.push(docSnap.data() as TaskInstance);
    });
  }

  pendingTasks.sort((a, b) =>
    `${a.due_date}_${a.due_time || ""}_${a.id}`.localeCompare(
      `${b.due_date}_${b.due_time || ""}_${b.id}`
    )
  );

  let updated = 0;
  for (const task of pendingTasks) {
    const assignee = selectFlexibleAssignee(activeCleaners, workloadTasks, task.due_date);

    await updateTask(task.id, {
      assigned_to: assignee.id,
      assigned_by: "p1",
      updated_at: new Date().toISOString()
    });

    workloadTasks.push({ ...task, assigned_to: assignee.id });
    updated += 1;
  }

  invalidateMetadataCaches();
  return { updated, skipped: pendingTasks.length - updated };
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

  // Strip out explicit undefined fields to avoid unintended overrides
  const cleanedProfile: any = {};
  for (const [k, v] of Object.entries(profile)) {
    if (v !== undefined) {
      cleanedProfile[k] = v;
    }
  }

  const { password, ...profileWithoutPassword } = cleanedProfile;

  let finalProfile: any;
  let generatedPassword: string | undefined;

  if (!profile.id) {
    // New profile creation: default is_active to true ONLY when creating if not explicitly boolean
    const isActive = typeof profile.is_active === "boolean" ? profile.is_active : true;
    generatedPassword = typeof password === "string" && password.length > 0 ? password : generateSecureRandomPassword();
    finalProfile = {
      ...profileWithoutPassword,
      is_active: isActive,
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
    const existing = snap?.exists() ? snap.data() : {};

    // Preserve existing is_active if not explicitly passed as a boolean in this update
    const isActive = typeof profile.is_active === "boolean" 
      ? profile.is_active 
      : (existing.is_active === true ? true : false);

    if (typeof password === "string" && password.length > 0) {
      finalProfile = {
        ...existing,
        ...profileWithoutPassword,
        is_active: isActive,
        password: await createPasswordRecord(password),
        updated_at: new Date().toISOString()
      };
    } else if ((existing as any).password) {
      finalProfile = {
        ...existing,
        ...profileWithoutPassword,
        is_active: isActive,
        password: await normalizePasswordRecord((existing as any).password, profile.username === "admin" ? "admin123" : "123456"),
        updated_at: new Date().toISOString()
      };
    } else {
      const fallback = profile.username === "admin" ? "admin123" : generateSecureRandomPassword();
      finalProfile = {
        ...existing,
        ...profileWithoutPassword,
        is_active: isActive,
        password: await createPasswordRecord(fallback),
        updated_at: new Date().toISOString()
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
  const now = Date.now();
  if (cachedZones && now - cachedZones.timestamp < METADATA_CACHE_TTL_MS) {
    return cachedZones.data;
  }
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
  cachedZones = { data: zones, timestamp: now };
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
      console.log(`[saveZone] Auto-uploading cover image to Cloudinary for zone ${finalZone.id}...`);
      const uploadedUrl = await uploadPhoto(finalZone.cover_image_url, `zones/${finalZone.id}/cover.jpg`);
      finalZone.cover_image_url = uploadedUrl;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(`naris_zone_image_${finalZone.id}`, uploadedUrl);
      }
    } catch (err) {
      console.warn(`[saveZone] Failed to auto-upload cover image to Cloudinary:`, err);
    }
  }
  await setDoc(doc(db, "zones", finalZone.id), finalZone);
  invalidateMetadataCaches();
  return finalZone as Zone;
}

export async function getSopItems(): Promise<SOPItem[]> {
  await ensureSeeded();
  const now = Date.now();
  if (cachedSopItems && now - cachedSopItems.timestamp < METADATA_CACHE_TTL_MS) {
    return cachedSopItems.data;
  }

  if (useLocalFallback) {
    const items = Object.values(localDB.sop_items || {}) as SOPItem[];
    items.sort((a, b) => (a.task_code || "").localeCompare(b.task_code || ""));
    cachedSopItems = { data: items, timestamp: now };
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
  cachedSopItems = { data: items, timestamp: now };
  return items;
}

export async function getTemplates(): Promise<TaskTemplate[]> {
  return getSopItems();
}

export async function pregenerateTaskInstances(tpl: SOPItem, daysCount = 7): Promise<void> {
  console.log(`[Pregenerate] Generating task instances for SOP item ${tpl.id} (${tpl.title}) for next ${daysCount} days...`);
  try {
    const profiles = await getProfiles();
    const zones = await getRawZones();
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

    for (const dateStr of dates) {
      const occurrences = getSopOccurrencesForDate(tpl, dateStr);
      for (const occurrence of occurrences) {
        const instanceId = generateTaskInstanceId(tpl.id, dateStr, occurrence.occurrenceIndex);
        // Check existence with a lightweight getDoc to avoid loading all instances
        const existingSnap = await getDoc(doc(db, "task_instances", instanceId));
        let legacyExists = false;
        if (occurrence.occurrenceIndex === 0) {
          const legacySnap = await getDoc(doc(db, "task_instances", `ti_rec_${tpl.id}_${dateStr}`));
          legacyExists = legacySnap.exists();
        }
        if (!existingSnap.exists() && !legacyExists) {
          let assignedTo = "";
          if (tpl.default_assignee_id) {
            const defaultCleaner = profiles.find((p) => p.id === tpl.default_assignee_id);
            if (defaultCleaner && isEligibleCleaner(defaultCleaner)) {
              assignedTo = defaultCleaner.id;
            }
          }
          if (!assignedTo) {
            const tplZone = zones.find((z) => z.id === tpl.zone_id);
            if (tplZone?.responsible_employee_id) {
              const respEmp = profiles.find((p) => p.id === tplZone.responsible_employee_id);
              if (respEmp && isEligibleCleaner(respEmp)) {
                assignedTo = respEmp.id;
              }
            }
          }
          if (!assignedTo) {
            const activeCleaners = getEligibleCleaners(profiles);
            if (activeCleaners.length > 0) {
              const dayInstancesSnap = await getDocs(query(collection(db, "task_instances"), where("due_date", "==", dateStr)));
              const dayInstances: TaskInstance[] = [];
              dayInstancesSnap.forEach((d) => dayInstances.push(d.data() as TaskInstance));
              const best = selectFlexibleAssignee(activeCleaners, dayInstances, dateStr);
              assignedTo = best.id;
            } else {
              console.warn(`[Pregenerate] No active cleaners available for SOP ${tpl.id} on ${dateStr}. Skipping.`);
              continue;
            }
          }
          const newInstance = buildTaskInstanceSnapshot(tpl, dateStr, occurrence, assignedTo);
          await setDoc(doc(db, "task_instances", instanceId), newInstance, { merge: true });
        }
      }
    }
    console.log(`[Pregenerate] Completed for SOP item ${tpl.id}.`);
  } catch (err) {
    console.error("[Pregenerate] Failed:", err);
  }
}
export async function saveSopItem(item: Partial<SOPItem>): Promise<SOPItem> {
  await ensureSeeded();
  if (item.default_assignee_id && item.default_assignee_id.trim() !== "") {
    const profiles = await getProfiles();
    const targetProfile = profiles.find((p) => p.id === item.default_assignee_id);
    if (!targetProfile || !isEligibleCleaner(targetProfile)) {
      throw new Error("لا يمكن إسناد SOP لموظف غير نشط.");
    }
  }
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

  if (finalItem.reference_image_url && finalItem.reference_image_url.startsWith("data:")) {
    try {
      console.log(`[saveSopItem] Auto-uploading reference image to Cloudinary for SOP item ${finalItem.id}...`);
      const uploadedUrl = await uploadPhoto(finalItem.reference_image_url, `sop_items/${finalItem.id}/ref.jpg`);
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
            requires_signature: false,
            assigned_to: finalItem.default_assignee_id || ti.assigned_to,
            due_time: ti.due_time || "09:00",
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
    instances.push(normalizeTaskPhotoUrls(docSnap.data() as TaskInstance));
  });

  // Load profiles and zones early to support smart "Flexible Auto-Distribution"
  const profiles = await getProfiles();
  const zones = await getRawZones();

  // Generate missing recurring tasks for active templates that run today per-template
  const templates = await getTemplates();
  const todayDayNameAr = getArabicDayName(todayStr);
  let generatedAny = false;

  for (const tpl of templates) {
    const occurrences = getSopOccurrencesForDate(tpl, todayStr);
    for (const occurrence of occurrences) {
      const instanceId = generateTaskInstanceId(tpl.id, todayStr, occurrence.occurrenceIndex);
      const alreadyExists = instances.some((ti) => ti.id === instanceId);
      const legacyExists = occurrence.occurrenceIndex === 0 && instances.some((ti) => ti.id === `ti_rec_${tpl.id}_${todayStr}`);
      if (!alreadyExists && !legacyExists) {
        if (!generatedAny) {
          console.log(`[Firestore Client] Generating missing recurring SOP tasks for ${todayStr}...`);
          generatedAny = true;
        }
        let assignedTo = "";
        if (tpl.default_assignee_id) {
          const defaultEmp = profiles.find((p) => p.id === tpl.default_assignee_id);
          if (defaultEmp && isEligibleCleaner(defaultEmp)) {
            assignedTo = defaultEmp.id;
          }
        }
        if (!assignedTo) {
          const tplZone = zones.find((z) => z.id === tpl.zone_id);
          if (tplZone?.responsible_employee_id) {
            const respEmp = profiles.find((p) => p.id === tplZone.responsible_employee_id);
            if (respEmp && isEligibleCleaner(respEmp)) {
              assignedTo = respEmp.id;
            }
          }
        }
        if (!assignedTo) {
          const activeCleaners = getEligibleCleaners(profiles);
          if (activeCleaners.length > 0) {
            const best = selectFlexibleAssignee(activeCleaners, instances, todayStr);
            assignedTo = best.id;
          } else {
            console.warn(`[Firestore Client] No active cleaners available for recurring task SOP ${tpl.id}. Skipping.`);
            continue;
          }
        }
        const newInstance = buildTaskInstanceSnapshot(tpl, todayStr, occurrence, assignedTo);
        await setDoc(doc(db, "task_instances", newInstance.id), newInstance, { merge: true });
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

export function listenTasksForDate(
  dateStr: string,
  userId: string | undefined,
  callback: (tasks: (TaskInstance & { zone?: Zone; assignee?: Profile; template?: TaskTemplate })[]) => void
): () => void {
  const targetDate = dateStr || getLocalDateString();

  // Fire off getTasks in background to generate any missing recurring tasks
  getTasks(targetDate).catch(console.error);

  const q = query(
    collection(db, "task_instances"),
    where("due_date", "==", targetDate)
  );

  const unsubscribe = onSnapshot(q, async (snap) => {
    try {
      const instances: TaskInstance[] = [];
      snap.forEach((docSnap) => {
        instances.push(normalizeTaskPhotoUrls(docSnap.data() as TaskInstance));
      });

      const filteredInstances = userId
        ? instances.filter(ti => ti.assigned_to === userId)
        : instances;

      // بعد (مُصلح):
      const [zones, profiles, templates] = await Promise.all([
        getRawZones(),   // ← cache-enabled, same as getTasks()
        getProfiles(),
        getTemplates()
      ]);

      // Deduplicate task instances by title, zone, date, and time
      const seenTask = new Set<string>();
      const uniqueInstances = filteredInstances.filter(t => {
        const key = `${(t.title || "").trim().toLowerCase()}_${t.zone_id || ""}_${t.due_date || ""}_${t.due_time || ""}`;
        if (seenTask.has(key)) return false;
        seenTask.add(key);
        return true;
      });

      const enrichedTasks = uniqueInstances.map((ti) => {
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

      // Sort by creation time so they appear predictably, or by due_time
      enrichedTasks.sort((a, b) => {
        if (a.due_time !== b.due_time) {
          return (a.due_time || "").localeCompare(b.due_time || "");
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      callback(enrichedTasks);
    } catch (error) {
      console.error("Error processing real-time tasks:", error);
    }
  }, (error) => {
    console.error("Error listening to task_instances:", error);
  });

  return unsubscribe;
}

export function listenTodayTasks(
  userId: string | undefined,
  callback: (tasks: (TaskInstance & { zone?: Zone; assignee?: Profile; template?: TaskTemplate })[]) => void
): () => void {
  return listenTasksForDate(getLocalDateString(), userId, callback);
}

export async function getTasksForRange(startDate: string, endDate: string): Promise<(TaskInstance & { zone?: Zone; assignee?: Profile; template?: TaskTemplate })[]> {
  await ensureSeeded();

  let instancesSnap;
  try {
    const q = query(
      collection(db, "task_instances"),
      where("due_date", ">=", startDate),
      where("due_date", "<=", endDate)
    );
    instancesSnap = await getDocs(q);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "task_instances");
  }

  const instances: TaskInstance[] = [];
  if (instancesSnap) {
    instancesSnap.forEach((docSnap) => {
      instances.push(normalizeTaskPhotoUrls(docSnap.data() as TaskInstance));
    });
  }

  const [templates, zones, profiles] = await Promise.all([
    getTemplates(),
    getRawZones(),
    getProfiles()
  ]);

  return instances.map((ti) => {
    const zone = zones.find((z) => z.id === ti.zone_id);
    const assignee = profiles.find((p) => p.id === ti.assigned_to);
    const template = templates.find((tpl) => tpl.id === (ti.sop_item_id || ti.template_id));
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
  const profiles = await getProfiles();
  const activeCleaners = getEligibleCleaners(profiles);

  let assignedTo = task.assigned_to;

  if (assignedTo && assignedTo.trim() !== "") {
    const targetCleaner = profiles.find((p) => p.id === assignedTo);
    if (!targetCleaner || !isEligibleCleaner(targetCleaner)) {
      throw new Error("لا يمكن إسناد مهمة جديدة لموظف غير نشط.");
    }
  } else {
    if (activeCleaners.length === 0) {
      throw new Error("لا يوجد موظفون نشطون متاحون لإسناد المهمة.");
    }
    const targetDate = task.due_date || getLocalDateString();
    let instancesSnap;
    try {
      const q = query(collection(db, "task_instances"), where("due_date", "==", targetDate));
      instancesSnap = await getDocs(q);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, "task_instances");
    }
    const instances: TaskInstance[] = [];
    if (instancesSnap) {
      instancesSnap.forEach((d) => instances.push(d.data() as TaskInstance));
    }
    const best = selectFlexibleAssignee(activeCleaners, instances, targetDate);
    assignedTo = best.id;
  }

  const id = "ti_" + randomHex(8);
  const newInstance: TaskInstance = {
    id,
    zone_id: (task.zone_id && task.zone_id !== "z1") ? task.zone_id : "z_reception",
    template_id: task.template_id || null,
    assigned_to: assignedTo,
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

  // Signature requirement disabled globally
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

    // Validate reassignment: target employee MUST be active cleaner
    if (updates.assigned_to && updates.assigned_to !== currentTask.assigned_to) {
      const profiles = await getProfiles();
      const targetProfile = profiles.find((p) => p.id === updates.assigned_to);
      if (!targetProfile || !isEligibleCleaner(targetProfile)) {
        throw new Error("لا يمكن إعادة إسناد المهمة لموظف غير نشط.");
      }
    }

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

    // 2. Enforce "before photo" requirement — use task instance snapshot first, SOP fallback only if undefined
    const requiresBefore = currentTask.requires_photo_before !== undefined
      ? currentTask.requires_photo_before
      : (template ? template.requires_photo_before : true);
    if (requiresBefore && (updates.status === "in_progress" || updates.status === "completed")) {
      const beforeUrl = merged.photo_before_url;
      if (!beforeUrl || beforeUrl.trim() === "" || beforeUrl.startsWith("data:")) {
        throw new Error("خطأ حماية: لا يمكن بدء أو إكمال هذه المهمة بدون التقاط ورفع صورة إثبات ما قبل البدء (Before Photo) إلى التخزين السحابي.");
      }
    }

    // 3. Enforce "after photo" requirement — use task instance snapshot first
    const requiresAfter = currentTask.requires_photo_after !== undefined
      ? currentTask.requires_photo_after
      : (template ? template.requires_photo_after : true);
    if (requiresAfter && updates.status === "completed") {
      const afterUrl = merged.photo_after_url;
      if (!afterUrl || afterUrl.trim() === "" || afterUrl.startsWith("data:")) {
        throw new Error("خطأ حماية: لا يمكن إغلاق وإكمال هذه المهمة بدون التقاط ورفع صورة إثبات جودة العمل (After Photo) إلى التخزين السحابي.");
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

      const requiresApproval = currentTask.requires_supervisor_approval !== undefined
        ? currentTask.requires_supervisor_approval
        : (template ? template.requires_supervisor_approval : true);
      if (!requiresApproval) {
        merged.supervisor_approved = true;
        merged.supervisor_approved_at = new Date().toISOString();
        merged.quality_grade = "A";
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

  // Determine eligible assignee for the rework task
  const profiles = await getProfiles();
  let reworkAssignee = originalTask.assigned_to;
  const originalProfile = profiles.find((p) => p.id === reworkAssignee);

  if (!originalProfile || !isEligibleCleaner(originalProfile)) {
    // Fallback 1: Zone responsible employee if eligible
    let fallbackAssignee = "";
    const zones = await getRawZones();
    const zone = zones.find((z) => z.id === originalTask.zone_id);
    if (zone?.responsible_employee_id) {
      const respEmp = profiles.find((p) => p.id === zone.responsible_employee_id);
      if (respEmp && isEligibleCleaner(respEmp)) {
        fallbackAssignee = respEmp.id;
      }
    }
    // Fallback 2: Flexible distribution among active cleaners with real workload calculation
    if (!fallbackAssignee) {
      const activeCleaners = getEligibleCleaners(profiles);
      if (activeCleaners.length > 0) {
        const todayStr = getLocalDateString();
        let existingInstances: TaskInstance[] = [];
        try {
          const instSnap = await getDocs(
            query(collection(db, "task_instances"), where("due_date", "==", todayStr))
          );
          instSnap.forEach((d) => existingInstances.push(d.data() as TaskInstance));
        } catch (err) {
          console.warn("[rejectTask] Could not fetch today instances for load calculation:", err);
        }
        const best = selectFlexibleAssignee(activeCleaners, existingInstances, todayStr);
        fallbackAssignee = best.id;
      } else {
        throw new Error("لا يوجد موظفون نشطون متاحون لإسناد مهمة إعادة العمل.");
      }
    }
    reworkAssignee = fallbackAssignee;
  }

  const reworkId = "ti_rework_" + randomHex(8);
  const reworkTask: TaskInstance = {
    id: reworkId,
    template_id: originalTask.template_id,
    zone_id: originalTask.zone_id,
    assigned_to: reworkAssignee,
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

export async function getKpis(dateRange?: { startDate?: string; endDate?: string }): Promise<KpiSummary[]> {
  await ensureSeeded();
  const profiles = await getProfiles();
  const cleaners = profiles.filter((p) => p.role === "cleaner");

  let instancesSnap;
  try {
    if (dateRange?.startDate && dateRange?.endDate) {
      const q = query(
        collection(db, "task_instances"),
        where("due_date", ">=", dateRange.startDate),
        where("due_date", "<=", dateRange.endDate)
      );
      instancesSnap = await getDocs(q);
    } else {
      const now = new Date();
      const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const currentMonthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

      const q = query(
        collection(db, "task_instances"),
        where("due_date", ">=", currentMonthStart),
        where("due_date", "<=", currentMonthEnd)
      );
      instancesSnap = await getDocs(q);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "task_instances");
  }
  const tasks: TaskInstance[] = [];
  if (instancesSnap) {
    instancesSnap.forEach((docSnap) => {
      tasks.push(normalizeTaskPhotoUrls(docSnap.data() as TaskInstance));
    });
  }

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
  const now = Date.now();
  if (cachedOperationalTasks && now - cachedOperationalTasks.timestamp < METADATA_CACHE_TTL_MS) {
    return cachedOperationalTasks.data;
  }
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
  cachedOperationalTasks = { data: tasks, timestamp: now };
  return tasks;
}

export async function getDeviceSwitches(): Promise<DeviceSwitch[]> {
  await ensureSeeded();
  const now = Date.now();
  if (cachedDeviceSwitches && now - cachedDeviceSwitches.timestamp < METADATA_CACHE_TTL_MS) {
    return cachedDeviceSwitches.data;
  }
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
  cachedDeviceSwitches = { data: switches, timestamp: now };
  return switches;
}

export function compressImage(base64Str: string, maxWidth = 1600, maxHeight = 1600, quality = 0.75): Promise<string> {
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

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
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




/**
 * Validates the canonical storage path format and ensures no undefined/null segments exist.
 */


export async function uploadPhoto(blobOrBase64: Blob | string, path: string): Promise<string> {
  const folder = path.split("/").slice(0, -1).join("/") || "naris_ops";
  const result = await uploadToCloudinary(blobOrBase64, folder);
  return result.secure_url;
}

export async function deletePhoto(path: string): Promise<void> {
  if (path && !path.startsWith("data:")) {
    console.warn(`[Cloudinary] Client-side deletion not supported. Path to clean manually: ${path}`);
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