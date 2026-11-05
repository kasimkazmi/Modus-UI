import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { registry, type RegistryItem } from "@/registry";
import { nativeFileOf } from "@/lib/registry";

const SRC = path.join(process.cwd(), "src");
const read = (file: string) => fs.readFileSync(path.join(SRC, file), "utf8");
const both = (registry as readonly RegistryItem[]).filter((item) => item.platform === "both");

// An item that works in React and React Native ships its React file first and, when the two differ,
// a React Native file beside it ending in `.native`, which Metro picks by itself.
describe("items for both platforms", () => {
  it.each(both)("$name lists a React file and at most one .native file", (item) => {
    expect(item.files.length).toBeLessThanOrEqual(2);
    expect(item.files[0]).not.toMatch(/\.native\.tsx?$/);
    if (item.files[1]) expect(item.files[1]).toBe(item.files[0].replace(/\.(tsx?)$/, ".native.$1"));
  });

  it.each(both)("$name has no web-only code in its React Native file", (item) => {
    const file = nativeFileOf(item);
    if (!file) return;
    const source = read(file);
    expect(source).not.toMatch(/\b(window|document|navigator)\b\./);
    expect(source).not.toMatch(/from\s+["'](react-dom|next\b|framer-motion|clsx|tailwind-merge)/);
  });

  it.each(both)("$name has no react-native import in its React file", (item) => {
    expect(read(item.files[0])).not.toMatch(/from\s+["']react-native["']/);
  });

  it.each(both.filter((item) => item.files.length === 2))(
    "$name has a React demo beside its React Native one",
    (item) => {
      expect(fs.existsSync(path.join(SRC, "registry/web-demos", `${item.name}.tsx`))).toBe(true);
    },
  );
});
