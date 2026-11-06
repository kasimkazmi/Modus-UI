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

/** Whether a component is a web (React) one, a React Native one, or works in both. Defaults to web. */
export function platformOf(item: RegistryItem): "web" | "native" | "both" {
  return item.platform ?? "web";
}

/** The React Native file of an item, when it has one that differs from its React file. */
export const nativeFileOf = (item: RegistryItem) =>
  item.platform === "native"
    ? item.files[0]
    : item.files.find((file) => /\.native\.tsx?$/.test(file));

export function getRegistryComponent(name: string) {
  const item: RegistryItem | undefined = registry.find((c) => c.name === name);
  if (!item) return null;

  const filePath = path.join(process.cwd(), "src", item.files[0]);
  const content = fs.readFileSync(filePath, "utf8");

  const nativeFile = nativeFileOf(item);
  return {
    ...item,
    content,
    nativeFile: item.platform === "both" ? nativeFile : undefined,
    nativeContent:
      item.platform === "both" && nativeFile
        ? fs.readFileSync(path.join(process.cwd(), "src", nativeFile), "utf8")
        : undefined,
  };
}
