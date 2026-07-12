import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { getSeededDB } from "./db_default";

const firebaseConfig = {
  apiKey: "AIzaSyCc3MP4cpQ-wmW9v-ovRPW3bNJ3MwGdYFY",
  authDomain: "vigilant-welder-0n50x.firebaseapp.com",
  projectId: "vigilant-welder-0n50x",
  storageBucket: "vigilant-welder-0n50x.firebasestorage.app",
  messagingSenderId: "972833537556",
  appId: "1:972833537556:web:f3ca0894063702f88d7101"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID
const db = initializeFirestore(app, {}, "ai-studio-narisops-9f622daa-687a-45a2-a871-9a4fc3b9a3d8");

let cacheDB: any = null;
const docRef = doc(db, "system", "database");

/**
 * Initializes the Firestore DB.
 * Fetches the document. If it doesn't exist, seeds it with initial data.
 * Also configures the onSnapshot listener for real-time synchronization.
 */
export async function initFirestoreDB(): Promise<void> {
  console.log("Connecting to Firestore database [system/database]...");
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      cacheDB = snap.data();
      console.log("Firestore database fetched successfully.");
    } else {
      console.warn("Firestore database document not found. Seeding initial data...");
      const seeded = getSeededDB();
      await setDoc(docRef, seeded);
      cacheDB = seeded;
      console.log("Firestore database seeded successfully.");
    }

    // Set up a real-time listener to keep the memory cache perfectly synced across multiple Cloud Run server instances.
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        cacheDB = docSnap.data();
        console.log("Firestore memory cache synced in real-time from cloud updates.");
      }
    }, (err) => {
      console.error("Firestore real-time subscription sync error:", err);
    });

  } catch (error) {
    console.error("Fatal error during initFirestoreDB:", error);
    // Safety fallback to locally generated seeded DB if Firestore connection fails or times out
    if (!cacheDB) {
      console.warn("Using local memory fallback database.");
      cacheDB = getSeededDB();
    }
  }
}

/**
 * Synchronously retrieves the current system database state.
 */
export function readFirestoreDB(): any {
  if (!cacheDB) {
    console.warn("readFirestoreDB called before cache initialization. Returning default seeded data.");
    return getSeededDB();
  }
  return cacheDB;
}

/**
 * Updates the database state both in local memory cache and Firestore asynchronously.
 */
export function writeFirestoreDB(data: any): void {
  if (!data) return;
  
  // Instantly update the local cache so the current request and subsequent local reads are immediate
  cacheDB = data;
  
  // Persist to Cloud Firestore in the background
  setDoc(docRef, data)
    .then(() => {
      console.log("Firestore database successfully saved to the cloud.");
    })
    .catch((err) => {
      console.error("Failed to save Firestore database in the background:", err);
    });
}
