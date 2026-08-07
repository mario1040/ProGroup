import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

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

async function run() {
  const app = initializeApp(firebaseConfig);
  const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

  const docRef = doc(db, "task_instances", "ti_e567bf260b373377");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    console.log("Document details for ti_e567bf260b373377:");
    console.log(JSON.stringify({ ...data, photo_after_url: "[BASE64_DATA]" }, null, 2));
  } else {
    console.log("Not found.");
  }

  // Also let's check what other collections exist in Firestore
  // Since we cannot list collections easily, let's try reading from known collections like "tasks", "task_templates", "zones", "profiles"
  const collections = ["tasks", "task_templates", "zones", "profiles", "users"];
  for (const c of collections) {
    const colRef = collection(db, c);
    try {
      const colSnap = await getDocs(colRef);
      console.log(`Collection ${c} has ${colSnap.size} documents.`);
    } catch (e) {
      console.log(`Failed to read collection ${c}`);
    }
  }

  process.exit(0);
}

run().catch(console.error);
