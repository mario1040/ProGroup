import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "cleaner2-a4188",
  appId: "1:364163945312:web:6592046af54daa7fd14405",
  apiKey: "AIzaSyDsKcSjVCXlrJ4luFMR2q8AlxiTdQN8v9A",
  authDomain: "cleaner2-a4188.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-narisops-9f622daa-687a-45a2-a871-9a4fc3b9a3d8",
  storageBucket: "cleaner2-a4188.firebasestorage.app",
  messagingSenderId: "364163945312",
  measurementId: ""
};

async function forensicSummary() {
  const app = initializeApp(firebaseConfig);
  const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

  const collections = ["sop_items", "task_templates", "task_instances"];
  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`COL_COUNT: ${colName} = ${snap.size}`);
    } catch (e: any) {
      console.error(`Error ${colName}:`, e.message);
    }
  }
  process.exit(0);
}

forensicSummary().catch(console.error);
