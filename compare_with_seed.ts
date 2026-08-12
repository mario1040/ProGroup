import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs } from "firebase/firestore";
import { getSeededDB } from "./src/db_default";

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

async function compareWithSeed() {
  const app = initializeApp(firebaseConfig);
  const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

  // Load active task_templates from Firestore
  const snap = await getDocs(collection(db, "task_templates"));
  const fsTemplates: any[] = [];
  snap.forEach((doc) => {
    fsTemplates.push({ id: doc.id, ...doc.data() });
  });

  // Load seed templates
  const seed = getSeededDB();
  const seedTemplates = seed.task_templates;

  console.log(`Firestore task_templates count: ${fsTemplates.length}`);
  console.log(`Default Seed templates count: ${seedTemplates.length}`);

  // Find added / custom templates not in default seed
  const seedIds = new Set(seedTemplates.map((t) => t.id));
  const customTemplates = fsTemplates.filter((t) => !seedIds.has(t.id));

  console.log(`\nNew/Custom SOP templates in Firestore (not in default seed): ${customTemplates.length}`);
  customTemplates.forEach((ct, i) => {
    console.log(`  [${i + 1}] ID: ${ct.id}, Title: ${ct.title}, Code: ${ct.task_code}`);
  });

  // Find differences in existing templates (custom modifications)
  console.log("\nModifications to existing default templates in Firestore:");
  let modCount = 0;
  fsTemplates.forEach((fsT) => {
    const seedT = seedTemplates.find((t) => t.id === fsT.id);
    if (seedT) {
      const diffFields: string[] = [];
      const keys = ["title", "description", "goal", "task_code", "category", "frequency", "tools_required", "requires_photo_before", "requires_photo_after", "requires_supervisor_approval", "reference_image_url", "guide_image_url", "is_active"];
      keys.forEach((k) => {
        const fsVal = fsT[k];
        const seedVal = (seedT as any)[k];
        // Handle comparison safely
        if (JSON.stringify(fsVal) !== JSON.stringify(seedVal)) {
          diffFields.push(`${k} (Firestore: '${fsVal}' vs Seed: '${seedVal}')`);
        }
      });

      if (diffFields.length > 0) {
        modCount++;
        console.log(`  ID: ${fsT.id}`);
        console.log(`    Title: ${fsT.title}`);
        diffFields.forEach((d) => console.log(`      * ${d}`));
      }
    }
  });

  console.log(`\nTotal modified existing templates: ${modCount}`);
  process.exit(0);
}

compareWithSeed().catch(console.error);
