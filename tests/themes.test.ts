import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { THEMES } from "@/lib/themes";

const css = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

/** Token names declared in the `[data-theme="<id>"]` block. */
function tokensOf(id: string): string[] {
  const block = css.match(new RegExp(`\\[data-theme="${id}"\\]\\s*\\{([^}]*)\\}`))?.[1] ?? "";
  return [...block.matchAll(/(--[a-z-]+)\s*:/g)].map(([, name]) => name).sort();
}

describe("site themes", () => {
  const reference = tokensOf("modus");

  it("defines the default theme", () => {
    expect(reference.length).toBeGreaterThan(0);
  });

  it.each(THEMES)("$id has a CSS block with every token the default defines", ({ id }) => {
    expect(tokensOf(id)).toEqual(reference);
  });

  it("has no CSS theme missing from the picker", () => {
    const declared = [...css.matchAll(/\[data-theme="([a-z-]+)"\]\s*\{/g)].map(([, id]) => id);
    expect(declared.sort()).toEqual(THEMES.map((t) => t.id).sort());
  });
});
