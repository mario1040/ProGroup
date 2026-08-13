import fs from "fs";

const content = fs.readFileSync("src/lib/api.ts", "utf-8");
const lines = content.split("\n");

console.log("=== SEARCHING 'sop_items' IN API ===");
lines.forEach((line, index) => {
  if (line.includes('"sop_items"') || line.includes("'sop_items'")) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
