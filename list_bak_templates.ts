import * as fs from "fs";

async function run() {
  fs.writeFileSync("./src/db_default_bak.ts", fs.readFileSync("./src/db_default.ts.bak"));
  try {
    const { getSeededDB: getBakDB } = await import("./src/db_default_bak");
    const bakDB = getBakDB();
    console.log(`Bak contains ${bakDB.task_templates.length} templates:`);
    bakDB.task_templates.forEach((t: any, i: number) => {
      console.log(`[${i + 1}] ID: ${t.id}, Code: ${t.task_code}, Title: ${t.title}`);
    });
  } catch (err: any) {
    console.error(err);
  } finally {
    try {
      fs.unlinkSync("./src/db_default_bak.ts");
    } catch (_) {}
  }
}

run();
