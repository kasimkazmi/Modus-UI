import fs from "fs";
import path from "path";
import { registry } from "../src/registry";

const REGISTRY_PATH = path.join(process.cwd(), "public/registry");

fs.mkdirSync(REGISTRY_PATH, { recursive: true });

console.log("🚀 Building registry...");

const failures: string[] = [];

for (const item of registry) {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), "src", item.files[0]), "utf8");
    const payload = { ...item, files: [{ path: item.files[0], content }] };

    fs.writeFileSync(
      path.join(REGISTRY_PATH, `${item.name}.json`),
      JSON.stringify(payload, null, 2),
    );
    console.log(`✅ ${item.name}.json generated`);
  } catch (error) {
    console.error(`❌ Error processing ${item.name}:`, error);
    failures.push(item.name);
  }
}

if (failures.length > 0) {
  console.error(`\n💥 Registry build failed for: ${failures.join(", ")}`);
  process.exit(1);
}

console.log(`✨ Registry build complete! (${registry.length} components)`);
