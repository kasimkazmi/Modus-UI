import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { modusThemeCss } from "@/lib/theme-css";
import { getGuideHeadings } from "@/lib/mdx";

const root = process.cwd();
const guide = fs.readFileSync(path.join(root, "src/content/guides/installation.mdx"), "utf8");
const tailwindConfig = fs.readFileSync(path.join(root, "tailwind.config.js"), "utf8");
const css = modusThemeCss();

/** CSS variables a Tailwind snippet refers to, e.g. `--primary-foreground`. */
const varsIn = (source: string) =>
  new Set([...source.matchAll(/var\((--[a-z-]+)\)/g)].map(([, v]) => v));

describe("installation guide", () => {
  it("ships every token the site's Tailwind config uses", () => {
    for (const token of varsIn(tailwindConfig)) {
      if (token.startsWith("--font-")) continue;
      expect(css, token).toContain(`${token}:`);
    }
  });

  it("documents a Tailwind config that uses only shipped tokens", () => {
    for (const token of varsIn(guide)) {
      expect(css, token).toContain(`${token}:`);
    }
  });

  it("defines dark values for every colour token", () => {
    const [light, dark] = css.split(".dark {");
    const names = (block: string) => [...block.matchAll(/(--[a-z-]+):/g)].map(([, n]) => n);
    expect(names(dark)).toEqual(names(light).filter((n) => n !== "--radius"));
  });

  it("gives every section a unique anchor", () => {
    const ids = getGuideHeadings("installation").map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("add-components");
  });
});
