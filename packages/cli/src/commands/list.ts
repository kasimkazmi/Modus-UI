import { fetchCatalogue } from "../registry.js";

export async function list(log: (line: string) => void = console.log): Promise<void> {
  const catalogue = await fetchCatalogue();
  log(`${catalogue.count} components available\n`);
  for (const category of catalogue.categories) {
    const items = catalogue.components.filter((c) => c.category === category);
    if (items.length === 0) continue;
    log(category);
    const width = Math.max(...items.map((c) => c.name.length));
    for (const c of items) log(`  ${c.name.padEnd(width)}  ${c.description}`);
    log("");
  }
  log("Add one with: npx @modus-ui/cli add <name>");
}
