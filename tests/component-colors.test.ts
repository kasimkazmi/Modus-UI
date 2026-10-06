import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { registry } from "@/registry";

/**
 * Components must take their colours from the theme tokens so they follow the
 * user's theme. Only components whose multi-colour palette IS the effect may
 * keep hex literals, and each of those palettes is overridable via props.
 */
const HEX_ALLOWED: Record<string, string> = {
  "aurora-background": "aurora blob hues; overridable via `colors`",
  "border-glow": "mesh gradient palette; overridable via `colors`",
  "gradient-text": "gradient palette; overridable via `colors`",
  "letter-glitch":
    "glitch palette and dark/light backdrop; overridable via `glitchColors` and `backgroundColor`",
  "pixel-card": "per-variant pixel palettes; overridable via `colors`",
};

const HEX = /#[0-9A-Fa-f]{3,8}\b/;

describe("component colours", () => {
  it.each(registry.map((item) => [item.name, item.files[0]] as const))(
    "%s uses theme tokens instead of hex colours",
    (name, file) => {
      if (name in HEX_ALLOWED) return;
      const source = readFileSync(join(process.cwd(), "src", file), "utf8");
      expect(source.match(HEX)?.[0]).toBeUndefined();
    },
  );
});
