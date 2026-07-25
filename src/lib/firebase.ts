import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Hardcoded static configuration as a robust fallback to ensure zero runtime file system or download dependencies
export const firebaseConfig = {
  projectId: "cleaner-app-1d3ca",
  appId: "1:532847956008:web:d7525bc221853ed0cea51d",
  apiKey: "AIzaSyBxFRjVLssowts5qzpmpepifr6CabymWuY",
  authDomain: "cleaner-app-1d3ca.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-narisops-9f622daa-687a-45a2-a871-9a4fc3b9a3d8",
  storageBucket: "cleaner-app-1d3ca.firebasestorage.app",
  messagingSenderId: "532847956008",
  measurementId: ""
};

// Safe initialization of Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with custom database ID from config
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable standard retry behavior for uploads (reduced to 15s to avoid long hangs on CORS/Network errors)
storage.maxUploadRetryTime = 2000;
storage.maxOperationRetryTime = 2000;

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
