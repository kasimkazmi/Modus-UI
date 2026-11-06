import fs from "fs";
import path from "path";
import { CATEGORIES, registry } from "../src/registry";
import { readComponentDoc } from "../src/lib/agent-docs";
import { SITE } from "../src/lib/site";

const REGISTRY_PATH = path.join(process.cwd(), "public/registry");

fs.mkdirSync(REGISTRY_PATH, { recursive: true });

console.log("🚀 Building registry...");

const failures: string[] = [];

for (const item of registry) {
  try {
    const files = item.files.map((file) => ({
      path: file,
      content: fs.readFileSync(path.join(process.cwd(), "src", file), "utf8"),
    }));
    const payload = { ...item, files };

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

// The catalogue the CLI and MCP server read: one small file instead of 50 fetches.
const catalogue = {
  name: SITE.name,
  homepage: SITE.url,
  count: registry.length,
  categories: CATEGORIES,
  components: registry.map((item) => ({
    name: item.name,
    title: item.title,
    category: item.category,
    platform: (item as { platform?: string }).platform ?? "web",
    description: readComponentDoc(item.name).description,
    dependencies: item.dependencies,
  })),
  // Old slug -> current slug, so the CLI can still resolve names from before a rename.
  renamed: JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "component-redirects.json"), "utf8"),
  ),
};
fs.writeFileSync(path.join(REGISTRY_PATH, "index.json"), JSON.stringify(catalogue, null, 2));

if (failures.length > 0) {
  console.error(`\n💥 Registry build failed for: ${failures.join(", ")}`);
  process.exit(1);
}

console.log(`✨ Registry build complete! (${registry.length} components)`);
