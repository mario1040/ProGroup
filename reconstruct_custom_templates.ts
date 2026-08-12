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

async function reconstruct() {
  const app = initializeApp(firebaseConfig);
  const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

  const snap = await getDocs(collection(db, "task_instances"));
  const reconstructedTemplates: Record<string, any> = {};

  snap.forEach((doc) => {
    const data = doc.data();
    const templateId = data.template_id || data.sop_item_id;
    if (templateId && (templateId.startsWith("t_cust_") || templateId.startsWith("t1_") || templateId.startsWith("t2_") || templateId.startsWith("t3_") || templateId.startsWith("t4_") || templateId.startsWith("t5_") || templateId.startsWith("t6_") || templateId.startsWith("t7_") || templateId.startsWith("t8_") || templateId.startsWith("t9_") || templateId.startsWith("t10_"))) {
      if (!reconstructedTemplates[templateId]) {
        reconstructedTemplates[templateId] = {
          id: templateId,
          title: data.title,
          description: data.description || "",
          goal: data.goal || "",
          task_code: data.task_code || "",
          category: data.category || "",
          frequency: data.frequency || "يومي",
          tools_required: data.tools_required || "",
          estimated_duration_minutes: data.estimated_duration_minutes || 15,
          requires_photo_before: !!data.requires_photo_before,
          requires_photo_after: !!data.requires_photo_after,
          requires_supervisor_approval: !!data.requires_supervisor_approval,
          requires_gps: !!data.requires_gps,
          requires_signature: !!data.requires_signature,
          reference_image_url: data.reference_image_url || "",
          guide_image_url: data.guide_image_url || "",
          zone_id: data.zone_id || "",
          is_active: true,
          instance_count: 0
        };
      }
      reconstructedTemplates[templateId].instance_count++;
    }
  });

  const templatesList = Object.values(reconstructedTemplates);
  console.log(`Reconstructed ${templatesList.length} unique custom templates from task_instances:`);
  templatesList.forEach((t, i) => {
    console.log(`[${i + 1}] ID: ${t.id}`);
    console.log(`    Code: ${t.task_code}`);
    console.log(`    Title: ${t.title}`);
    console.log(`    Goal: ${t.goal}`);
    console.log(`    Tools: ${t.tools_required}`);
    console.log(`    Instances Found: ${t.instance_count}`);
    console.log(`    Zone ID: ${t.zone_id}`);
    console.log(`    Ref Image: ${t.reference_image_url ? "YES" : "NO"}`);
    console.log(`    Guide Image: ${t.guide_image_url ? "YES" : "NO"}`);
  });

  process.exit(0);
}

reconstruct().catch(console.error);
