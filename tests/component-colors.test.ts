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
  "draft-folio": "black canvas and CSS mask stops; masks carry no visible colour",
  "aurora-veil": "Aurora needs fixed cyan/violet/green on a night sky",
  "liquid-chrome-orb": "Chrome needs neutral light/dark metal tones",
  "plasma-glow": "Plasma needs a saturated dark-to-bright pair",
  "nebula-orb": "fixed space palette for the emission gas",
  "godray-haze": "warm light rays over a dusk sky",
  "ink-canvas": "ink needs a near-black canvas",
  "holo-foil": "neutral dark backdrop so the foil hues read",
  "crystal-cells": "indigo cells chosen to show refraction",
  "fluted-gradient": "gradient palette; overridable via `colors`",
  "ripple-pool": "swirl palette; overridable via `colors`",
  "sylva-world": "original Sylva backdrop and light-pool colours kept as defaults",
  "temple-night": "original Kage night scene palette kept as defaults",
  "procedural-landscape": "literal port of the Landscape time/weather palette tables",
  "tower-landscape": "literal port of the country-tower material and time/weather palettes",
  "bookshelf-scene": "literal port of the seven-volume book palette and room colours",
  "salon-banner": "original per-variant plate palettes; overridable via `colors`",
  "folio-opening": "original section background and inlined SVG illustration fills",
  "aurora-background": "aurora blob hues; overridable via `colors`",
  "border-glow": "mesh gradient palette; overridable via `colors`",
  "gradient-text": "gradient palette; overridable via `colors`",
  "letter-glitch":
    "glitch palette and dark/light backdrop; overridable via `glitchColors` and `backgroundColor`",
  "pixel-card": "per-variant pixel palettes; overridable via `colors`",
  "node-weave":
    "faithful ThreeUI port; gold-on-navy palette exposed via color/backgroundColor props",
  "mosaic-crest":
    "faithful ThreeUI port; original dark/paper scene backgrounds with backgroundColor override",
  "forecast-curve":
    "faithful ThreeUI port; original black/paper scene backgrounds with backgroundColor override",
  condensation:
    "faithful ThreeUI port; blue droplet palette and dark glass background exposed as props",
  laser: "ThreeUI scene background; overridable via `backgroundColor`",
  "phosphor-tube":
    "authored phosphor, film, blue-screen and pixel-art palettes painted into the CRT texture",
  "bough-study":
    "original ThreeUI scene background exposed as backgroundColor default; palette via colors",
  "loom-field": "Original ThreeUI cloth textures, lights and backdrops baked into canvas textures",
  "tactile-switch":
    "Original ThreeUI classic/modern/glass/shader palettes for light and dark modes",
  nebula: "Original ThreeUI shader colours and background as overridable defaults",
  sketchbook: "Original ThreeUI paper, ink and accent colours exposed via colour props",
  "dust-signature": "Original ThreeUI palette as overridable prop defaults",
  "echo-letters": "Original ThreeUI palette as overridable prop defaults",
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
