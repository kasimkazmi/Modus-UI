import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { registry } from "@/registry";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), "src", file), "utf8");

describe("reduced motion", () => {
  it.each(registry)("$name consults prefers-reduced-motion", (item) => {
    const source = read(item.files[0]);
    // useReducedMotion for JS-driven motion; Tailwind's motion-reduce: for CSS-only motion.
    expect(source).toMatch(/useReducedMotion\(|motion-reduce:/);
  });

  it.each(registry)("$name uses the value it reads", (item) => {
    const source = read(item.files[0]);
    const binding = source.match(/const (\w+) = useReducedMotion\(\)/)?.[1];
    if (!binding) return;
    expect(source.split(binding).length - 1, `${binding} is read but never used`).toBeGreaterThan(
      1,
    );
  });
});
