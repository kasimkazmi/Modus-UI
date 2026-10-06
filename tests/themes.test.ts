import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PALETTES } from "@/lib/themes";

const css = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

/** Token names declared in the block whose selector ends with `selector`. */
function tokensOf(selector: string): string[] {
  const escaped = selector.replace(/[.[\]"]/g, "\\$&");
  const block = css.match(new RegExp(`(?:^|[\\s,])${escaped}\\s*\\{([^}]*)\\}`, "m"))?.[1] ?? "";
  return [...block.matchAll(/(--[a-z-]+)\s*:/g)].map(([, name]) => name).sort();
}

describe("site palettes", () => {
  const light = tokensOf('[data-palette="modus"]');
  const dark = tokensOf('.dark[data-palette="modus"]');

  it("defines the default palette in both modes", () => {
    expect(light).toContain("--font-heading");
    expect(dark).toContain("--background");
  });

  it.each(PALETTES)("$id defines every light token", ({ id }) => {
    expect(tokensOf(`[data-palette="${id}"]`)).toEqual(light);
  });

  it.each(PALETTES)("$id defines every dark colour token", ({ id }) => {
    expect(tokensOf(`.dark[data-palette="${id}"]`)).toEqual(dark);
  });

  it("has no CSS palette missing from the picker", () => {
    const declared = new Set(
      [...css.matchAll(/\[data-palette="([a-z-]+)"\]\s*\{/g)].map(([, id]) => id),
    );
    expect([...declared].sort()).toEqual(PALETTES.map((p) => p.id).sort());
  });
});
