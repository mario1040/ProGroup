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

async function checkInstances() {
  const app = initializeApp(firebaseConfig);
  const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

  const snap = await getDocs(collection(db, "task_instances"));
  const templateIds = new Set<string>();
  const sopItemIds = new Set<string>();
  
  snap.forEach((doc) => {
    const data = doc.data();
    if (data.template_id) templateIds.add(data.template_id);
    if (data.sop_item_id) sopItemIds.add(data.sop_item_id);
  });

  console.log("Unique template_ids in task_instances:", [...templateIds]);
  console.log("Unique sop_item_ids in task_instances:", [...sopItemIds]);

  process.exit(0);
}

checkInstances().catch(console.error);
