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
  "amber-halftone": "original amber/white/black palette; overridable via `color` props",
  "neon-sign": "original neon glass, tube and electrode colours baked into canvas passes",
  "gallery-heading": "original per-variant plate palettes; overridable via `colors`",
  "rectangle-button": "authored per-variant grounds and button palettes (22 treatments)",
  "editorial-intro": "original section background and inlined SVG illustration fills",
  "newsletter-footer": "original footer background and glass-button mask colours",
  "aurora-background": "aurora blob hues; overridable via `colors`",
  "border-glow": "mesh gradient palette; overridable via `colors`",
  "gradient-text": "gradient palette; overridable via `colors`",
  "letter-glitch":
    "glitch palette and dark/light backdrop; overridable via `glitchColors` and `backgroundColor`",
  "pixel-card": "per-variant pixel palettes; overridable via `colors`",
  "constellation-field":
    "faithful ThreeUI port; gold-on-navy palette exposed via color/backgroundColor props",
  "portal-field": "faithful ThreeUI port; shader core/fringe/background colours exposed as props",
  "data-pixel-arc":
    "faithful ThreeUI port; original dark/paper scene backgrounds with backgroundColor override",
  "predictive-arc":
    "faithful ThreeUI port; original black/paper scene backgrounds with backgroundColor override",
  condensation:
    "faithful ThreeUI port; blue droplet palette and dark glass background exposed as props",
  "bell-field": "ThreeUI palette; overridable via `colors`, `emberColors` and `backgroundColor`",
  "stream-convergence": "ThreeUI stream colours; overridable via `colors` and `backgroundColor`",
  "ribbon-field": "ThreeUI palette; overridable via `colors` and `backgroundColor`",
  "energy-orb": "ThreeUI scene background; overridable via `backgroundColor`",
  laser: "ThreeUI scene background; overridable via `backgroundColor`",
  "lumen-cta": "Lumen's authored violet gradient, ring and stage colours as overridable defaults",
  "typography-vortex": "ThreeUI's authored canvas surfaces and caption ink",
  "crt-screen":
    "authored phosphor, film, blue-screen and pixel-art palettes painted into the CRT texture",
  "editorial-heading": "Article Headings' authored editorial dark/light palette",
  "orbital-sphere": "ThreeUI palette; overridable via colour props",
  "dot-matrix": "ThreeUI palette; overridable via `color`/`backgroundColor`",
  "emerald-horizon": "ThreeUI shader colours; overridable via `colors`/`backgroundColor`",
  "structure-flow": "ThreeUI palette; overridable via `color`/`backgroundColor`",
  "warp-field": "ThreeUI per-variant palettes; overridable via `colors`/`backgroundColor`",
  "orbit-gallery": "ThreeUI paper background; overridable via `backgroundColor`/`dotColor`",
  "generative-tree":
    "original ThreeUI scene background exposed as backgroundColor default; palette via colors",
  "elemental-field": "ThreeUI scene background; overridable via `backgroundColor`",
  "top-dock": "ThreeUI sable/modern/retro/glass palettes and inline stylesheet",
  "particle-drift": "original ThreeUI dark/light ASCII glyph and beam palette",
  "particle-network": "original ThreeUI dark/light background colours",
  "gateway-flow": "original ThreeUI dark/light background colours",
  "connectivity-graph": "original ThreeUI dark/light background colours",
  "interface-lines": "original ThreeUI dark/light background colours",
  "defense-lines": "original ThreeUI crimson dark/light background colours",
  "topo-field": "original ThreeUI dark/light background colours",
  "star-portal": "Original ThreeUI button and scene colours kept as overridable defaults",
  "ignition-button": "Original ThreeUI button and scene colours kept as overridable defaults",
  "induction-button": "Original ThreeUI button and scene colours kept as overridable defaults",
  "plasma-button": "Original ThreeUI button and scene colours kept as overridable defaults",
  "tactile-button": "Original ThreeUI button and scene colours kept as overridable defaults",
  "thinking-button": "Original ThreeUI button and scene colours kept as overridable defaults",
  "signal-particles": "ThreeUI palette and background; overridable via colour props",
  "override-grid": "ThreeUI palette and background; overridable via colour props",
  "void-field": "ThreeUI palette and background; overridable via colour props",
  "halftone-flow": "ThreeUI palette and background; overridable via colour props",
  "cloud-field": "ThreeUI palette and background; overridable via colour props",
  "flow-field": "ThreeUI palette and background; overridable via colour props",
  "woven-cloth": "Original ThreeUI cloth textures, lights and backdrops baked into canvas textures",
  "semantic-bloom": "Original ThreeUI surface and ink colours as overridable defaults",
  "globe-study": "Original ThreeUI surface and ink colours as overridable defaults",
  "outline-typeflow": "Original ThreeUI surface and ink colours as overridable defaults",
  "morphing-glyph-cloud": "Original ThreeUI surface and ink colours as overridable defaults",
  "cloth-study": "Original ThreeUI surface and ink colours as overridable defaults",
  "ripple-study": "Original ThreeUI surface and ink colours as overridable defaults",
  "ball-study": "Original ThreeUI surface and ink colours as overridable defaults",
  "brand-orb": "Original ThreeUI orb backgrounds, brand accent colours and logo paint colours",
  "diagnostics-panel": "Original ThreeUI emerald stroke and panel fill defaults",
  "skeuomorphic-toggle":
    "Original ThreeUI classic/modern/glass/shader palettes for light and dark modes",
  "wireframe-form": "Original ThreeUI ink defaults",
  "performance-gauge": "Original ThreeUI gauge face, needle, zone and screw colours",
  "generate-button": "Original ThreeUI generate button surface and glow colours as defaults",
  "spinning-border-button": "Original ThreeUI beam colour default",
  "gradient-cta": "Original ThreeUI golden gradient and text colours as defaults",
  "trochil-signal": "Original ThreeUI stage and button palette (dark + light mode)",
  "attune-thermal": "Original ThreeUI thermal gradient and stage palette (dark + light mode)",
  "tideform-outline": "Original ThreeUI outline and orange palette (dark + light mode)",
  "expanse-field": "Original ThreeUI shader colours and background as overridable defaults",
  "logic-core": "Original ThreeUI shader colours and background as overridable defaults",
  "dimensional-field": "Original ThreeUI shader colours and background as overridable defaults",
  "data-field": "Original ThreeUI shader colours and background as overridable defaults",
  "topology-field": "Original ThreeUI shader colours and background as overridable defaults",
  nebula: "Original ThreeUI shader colours and background as overridable defaults",
  "fluid-field": "Original ThreeUI shader colours and background as overridable defaults",
  "ember-storm": "Original ThreeUI shader colours and background as overridable defaults",
  "flux-vortex": "Original ThreeUI shader colours and background as overridable defaults",
  "understory-arrow-pill": "Original ThreeUI button and ground colours as overridable defaults",
  "meridian-keycap": "Original ThreeUI button and ground colours as overridable defaults",
  "halvorsen-arrow-pill": "Original ThreeUI button and ground colours as overridable defaults",
  "aster-glass-button": "Original ThreeUI button and ground colours as overridable defaults",
  "circle-button": "Original ThreeUI button and ground colours as overridable defaults",
  "liquid-metal-button": "Original ThreeUI button and ground colours as overridable defaults",
  "spark-badge": "Original ThreeUI button and ground colours as overridable defaults",
  sketchbook: "Original ThreeUI paper, ink and accent colours exposed via colour props",
  "dark-pill": "Original ThreeUI button and stage colours as overridable defaults",
  "launch-button": "Original ThreeUI button and stage colours as overridable defaults",
  "dot-border-button": "Original ThreeUI button and stage colours as overridable defaults",
  "floating-dots-cta": "Original ThreeUI button and stage colours as overridable defaults",
  "sliding-text-cta": "Original ThreeUI button and stage colours as overridable defaults",
  "gradient-beam-cta": "Original ThreeUI button and stage colours as overridable defaults",
  "gradient-pill-button": "Original ThreeUI button and stage colours as overridable defaults",
  "intro-wordmark": "Original ThreeUI palette as overridable prop defaults",
  "particle-wordmark": "Original ThreeUI palette as overridable prop defaults",
  "audio-wordmark": "Original ThreeUI palette as overridable prop defaults",
  "character-carousel": "Original ThreeUI palette as overridable prop defaults",
  "uplink-loader": "Original ThreeUI palette as overridable prop defaults",
  "engraved-certificate": "Original ThreeUI palette as overridable prop defaults",
  "koi-studies": "Original ThreeUI palette as overridable prop defaults",
  "glassmorphism-cta": "Original ThreeUI glass, beam and stage colours as overridable defaults",
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
