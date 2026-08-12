import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Hardcoded static configuration as a robust fallback to ensure zero runtime file system or download dependencies
export const firebaseConfig = {
  projectId: "cleaner2-a4188",
  appId: "1:364163945312:web:6592046af54daa7fd14405",
  apiKey: "AIzaSyDsKcSjVCXlrJ4luFMR2q8AlxiTdQN8v9A",
  authDomain: "cleaner2-a4188.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-narisops-9f622daa-687a-45a2-a871-9a4fc3b9a3d8",
  storageBucket: "cleaner2-a4188.firebasestorage.app",
  messagingSenderId: "364163945312",
  measurementId: ""
};

// Safe initialization of Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with custom database ID from config
let dbInstance: any;
try {
  dbInstance = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
  console.log("[Firebase Init] Firestore initialized via initializeFirestore.");
} catch (e: any) {
  console.warn("[Firebase Init] initializeFirestore failed, falling back to getFirestore:", e);
  try {
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log("[Firebase Init] Firestore obtained via getFirestore fallback.");
  } catch (err: any) {
    console.error("[Firebase Init] Critical: getFirestore also failed:", err);
  }
}

export const db = dbInstance;
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable standard retry behavior for uploads (reduced to 15s to avoid long hangs on CORS/Network errors)
storage.maxUploadRetryTime = 15000;
storage.maxOperationRetryTime = 15000;

// --- Custom Firestore Error Handler (Mandatory as per Firebase Skill Guidelines) ---
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.error("Firestore Hardened Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
