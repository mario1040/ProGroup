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

async function listTemplates() {
  const app = initializeApp(firebaseConfig);
  const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

  const snap = await getDocs(collection(db, "task_templates"));
  console.log(`Firestore has ${snap.size} task_templates:`);
  snap.forEach((doc, i) => {
    const data = doc.data();
    console.log(`[${i + 1}] Document ID: ${doc.id}, Code: ${data.task_code}, Title: ${data.title}`);
  });

  process.exit(0);
}

listTemplates().catch(console.error);
