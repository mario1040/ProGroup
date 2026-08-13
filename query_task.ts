import { initializeApp } from "firebase/app";
import { initializeFirestore, getDocs, collection, query, where } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

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

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
const storage = getStorage(app);

async function run() {
  console.log("Searching for tasks with task_code SOP_TOF_01...");
  const tasksCol = collection(db, "task_instances");
  const q = query(tasksCol, where("task_code", "==", "SOP_TOF_01"));
  const querySnapshot = await getDocs(q);
  console.log(`Found ${querySnapshot.size} task(s).`);
  
  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    console.log("----------------------------------------");
    console.log(`Document ID: ${docSnap.id}`);
    console.log(JSON.stringify(data, null, 2));
    
    // Check Storage
    const beforeRef = ref(storage, `task-photos/${data.zone_id}/${docSnap.id}/before.jpg`);
    const afterRef = ref(storage, `task-photos/${data.zone_id}/${docSnap.id}/after.jpg`);
    
    try {
      const url = await getDownloadURL(beforeRef);
      console.log(`[Storage] before.jpg: EXISTS (${url})`);
    } catch (err: any) {
      console.log(`[Storage] before.jpg: NOT FOUND`);
    }

    try {
      const url = await getDownloadURL(afterRef);
      console.log(`[Storage] after.jpg: EXISTS (${url})`);
    } catch (err: any) {
      console.log(`[Storage] after.jpg: NOT FOUND`);
    }
  }
}

run().catch(console.error);
