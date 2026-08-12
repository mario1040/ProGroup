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

async function forensicCheck() {
  console.log("==============================================");
  console.log("   NARISOPS DATABASE FORENSIC SCAN REPORT");
  console.log("==============================================");

  const app = initializeApp(firebaseConfig);
  const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

  // 1. Counts
  const collections = ["sop_items", "task_templates", "task_instances"];
  const dataMap: Record<string, any[]> = {
    sop_items: [],
    task_templates: [],
    task_instances: []
  };

  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      snap.forEach((doc) => {
        dataMap[colName].push({ id: doc.id, ...doc.data() });
      });
      console.log(`Document count in [${colName}]: ${dataMap[colName].length}`);
    } catch (e: any) {
      console.error(`Error reading ${colName}:`, e.message || e);
    }
  }

  console.log("\n----------------------------------------------");
  console.log("  DETAILED SCAN: sop_items");
  console.log("----------------------------------------------");
  if (dataMap.sop_items.length === 0) {
    console.log("(No documents found in sop_items)");
  } else {
    dataMap.sop_items.forEach((item, index) => {
      console.log(`[${index + 1}] ID: ${item.id}`);
      console.log(`    Title: ${item.title}`);
      console.log(`    Task Code: ${item.task_code}`);
      console.log(`    Zone ID: ${item.zone_id}`);
      console.log(`    Ref Image URL: ${item.reference_image_url ? (item.reference_image_url.startsWith("data:") ? "DATA_URI (Base64)" : item.reference_image_url.substring(0, 80) + "...") : "None"}`);
      console.log(`    Guide Image URL: ${item.guide_image_url ? (item.guide_image_url.startsWith("data:") ? "DATA_URI (Base64)" : item.guide_image_url.substring(0, 80) + "...") : "None"}`);
      console.log(`    Is Active: ${item.is_active}`);
    });
  }

  console.log("\n----------------------------------------------");
  console.log("  DETAILED SCAN: task_templates");
  console.log("----------------------------------------------");
  if (dataMap.task_templates.length === 0) {
    console.log("(No documents found in task_templates)");
  } else {
    dataMap.task_templates.forEach((item, index) => {
      console.log(`[${index + 1}] ID: ${item.id}`);
      console.log(`    Title: ${item.title}`);
      console.log(`    Task Code: ${item.task_code}`);
      console.log(`    Zone ID: ${item.zone_id}`);
      console.log(`    Ref Image URL: ${item.reference_image_url ? (item.reference_image_url.startsWith("data:") ? "DATA_URI (Base64)" : item.reference_image_url.substring(0, 80) + "...") : "None"}`);
      console.log(`    Guide Image URL: ${item.guide_image_url ? (item.guide_image_url.startsWith("data:") ? "DATA_URI (Base64)" : item.guide_image_url.substring(0, 80) + "...") : "None"}`);
      console.log(`    Is Active: ${item.is_active}`);
    });
  }

  // Compare both collections
  console.log("\n----------------------------------------------");
  console.log("  COMPARING COLLECTIONS");
  console.log("----------------------------------------------");
  
  const sopIds = new Set(dataMap.sop_items.map((t) => t.id));
  const tplIds = new Set(dataMap.task_templates.map((t) => t.id));

  console.log(`SOP Items not in Task Templates: ${[...sopIds].filter(id => !tplIds.has(id)).length}`);
  console.log(`Task Templates not in SOP Items: ${[...tplIds].filter(id => !sopIds.has(id)).length}`);

  // Check for any potential modifications or differences
  const diffs: string[] = [];
  dataMap.task_templates.forEach((tpl) => {
    const matchingSop = dataMap.sop_items.find((sop) => sop.id === tpl.id);
    if (matchingSop) {
      const fieldDiffs: string[] = [];
      if (matchingSop.title !== tpl.title) fieldDiffs.push("title");
      if (matchingSop.task_code !== tpl.task_code) fieldDiffs.push("task_code");
      if (matchingSop.zone_id !== tpl.zone_id) fieldDiffs.push("zone_id");
      if (matchingSop.reference_image_url !== tpl.reference_image_url) fieldDiffs.push("reference_image_url");
      if (matchingSop.guide_image_url !== tpl.guide_image_url) fieldDiffs.push("guide_image_url");
      if (matchingSop.is_active !== tpl.is_active) fieldDiffs.push("is_active");
      
      if (fieldDiffs.length > 0) {
        diffs.push(`SOP and Template differ for ID [${tpl.id}] on fields: ${fieldDiffs.join(", ")}`);
      }
    }
  });

  if (diffs.length > 0) {
    console.log("Differences found on identical IDs:");
    diffs.forEach(d => console.log(`  - ${d}`));
  } else {
    console.log("No field differences found on records sharing the same ID.");
  }

  console.log("==============================================");
  process.exit(0);
}

forensicCheck().catch((err) => {
  console.error("Forensic check crashed:", err);
  process.exit(1);
});
