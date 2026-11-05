import fs from "fs";
import path from "path";
import { registry, type Category, type RegistryItem } from "@/registry";

/** Hooks, providers and theme tokens are not visual components: they have no colours or motion of their own. */
export const UTILITY_CATEGORIES: readonly Category[] = ["Hooks", "Providers", "Theme"];

export const isUtility = (item: RegistryItem) => UTILITY_CATEGORIES.includes(item.category);

const NEW_FOR_MS = 30 * 24 * 60 * 60 * 1000;

/** True for 30 days after a component's `added` date. */
export function isNew(item: RegistryItem) {
  return !!item.added && Date.now() - Date.parse(item.added) < NEW_FOR_MS;
}

/** Whether a component is a web (React) or React Native one. Defaults to web. */
export function platformOf(item: RegistryItem): "web" | "native" {
  return item.platform ?? "web";
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
