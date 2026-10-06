import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { registry } from "@/registry";

const ROOT = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8");

function walk(dir: string): string[] {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(rel) : [rel];
  });
}

const sources = walk("src").filter((f) => /\.(tsx?|mdx?)$/.test(f));
const docs = [...walk("src/content"), "README.md", "COMPONENTS_GUIDE.md"].filter((f) =>
  /\.mdx?$/.test(f),
);

describe("coding standards (AGENTS.md)", () => {
  it("never uses gsap", () => {
    expect(sources.filter((f) => /from\s+["']gsap/.test(read(f)))).toEqual([]);
  });

  // Theme tokens are bare HSL channels (`--primary: 24 8% 20%`), so a raw
  // `var(--primary)` is not a color: it renders transparent or black.
  it("wraps theme tokens in hsl() when used as a color", () => {
    const raw =
      /(?<!hsl\()var\(--(primary|secondary|accent|muted|background|foreground|border|ring|card|destructive|input|popover)(-foreground)?\)/;
    expect(sources.filter((f) => f.startsWith("src/registry") && raw.test(read(f)))).toEqual([]);
  });

  it("documents installs with the modus-ui CLI only", () => {
    const offenders = docs.filter((f) => /npx (shadcn|react-ui-component)/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it.each(registry)("$name merges its className prop with cn()", (item) => {
    const source = read(path.join("src", item.files[0]));
    if (!/className\??:/.test(source)) return;
    expect(source).toMatch(/import\s*\{[^}]*\bcn\b[^}]*\}\s*from\s*["']@\/lib\/utils["']/);
  });

  it.each(registry)("$name is a client component when it uses hooks or motion", (item) => {
    const source = read(path.join("src", item.files[0]));
    if (!/\buse[A-Z]\w*\(|framer-motion|motion\/react/.test(source)) return;
    expect(source.trimStart()).toMatch(/^["']use client["']/);
  });
});
