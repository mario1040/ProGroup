import { getSeededDB as getMainDB } from "./src/db_default";
import * as fs from "fs";

// To load the .bak file, we can read its content and replace any TS imports or evaluate it, or simply copy it to a .ts file
async function run() {
  // Copy src/db_default.ts.bak to src/db_default_bak.ts so we can import it
  fs.writeFileSync("./src/db_default_bak.ts", fs.readFileSync("./src/db_default.ts.bak"));

  try {
    const { getSeededDB: getBakDB } = await import("./src/db_default_bak");
    
    const mainDB = getMainDB();
    const bakDB = getBakDB();

    console.log("Main DB templates count:", mainDB.task_templates.length);
    console.log("Bak DB templates count:", bakDB.task_templates.length);

    // Let's check for differences between Main and Bak templates
    const mainIds = new Set(mainDB.task_templates.map(t => t.id));
    const bakIds = new Set(bakDB.task_templates.map(t => t.id));

    console.log("Templates in Bak but not in Main:", [...bakIds].filter(id => !mainIds.has(id)).length);
    console.log("Templates in Main but not in Bak:", [...mainIds].filter(id => !bakIds.has(id)).length);

    // Compare fields for identical IDs
    let diffsCount = 0;
    bakDB.task_templates.forEach((bakT: any) => {
      const mainT = mainDB.task_templates.find(t => t.id === bakT.id);
      if (mainT) {
        const diffFields: string[] = [];
        const keys = ["title", "description", "goal", "task_code", "category", "frequency", "tools_required", "requires_photo_before", "requires_photo_after", "requires_supervisor_approval", "reference_image_url", "guide_image_url", "is_active"];
        keys.forEach((k) => {
          if (JSON.stringify(bakT[k]) !== JSON.stringify((mainT as any)[k])) {
            diffFields.push(`${k} (Bak: '${bakT[k]}' vs Main: '${(mainT as any)[k]}')`);
          }
        });

        if (diffFields.length > 0) {
          diffsCount++;
          console.log(`  ID: ${bakT.id} (Title: ${bakT.title})`);
          diffFields.forEach(d => console.log(`    * ${d}`));
        }
      }
    });

    console.log("Total templates with differences:", diffsCount);

  } catch (err: any) {
    console.error("Comparison failed:", err);
  } finally {
    // Cleanup temporary file
    try {
      fs.unlinkSync("./src/db_default_bak.ts");
    } catch (_) {}
  }
}

run();
