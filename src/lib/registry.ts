import fs from "fs";
import path from "path";
import { registry, type RegistryItem } from "@/registry";

const NEW_FOR_MS = 30 * 24 * 60 * 60 * 1000;

/** True for 30 days after a component's `added` date. */
export function isNew(item: RegistryItem) {
  return !!item.added && Date.now() - Date.parse(item.added) < NEW_FOR_MS;
}

export function getRegistryComponent(name: string) {
  const item = registry.find((c) => c.name === name);
  if (!item) return null;

  const filePath = path.join(process.cwd(), "src", item.files[0]);
  const content = fs.readFileSync(filePath, "utf8");

  return {
    ...item,
    content,
  };
}
