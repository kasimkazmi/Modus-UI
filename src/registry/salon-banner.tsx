"use client";
// Ported from ThreeUI Community's Gallery Heading (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/* Four galleries: each brings its own orbit, twelve flat plate colours, the
   procedural field the plates are shaded with, the headline face, and the way
   the ring comes up to speed when a pointer arrives. */
const VARIANTS = {
  /* the house gallery: plates mixed from the theme tokens, set in the heading face */
  tonal: {
    headline: ["Twelve quiet", "studies in tone"],
    headlineWidths: [0, 0],
    axis: -14,
    phase: 90,
    direction: 1,
    field: "halftone",
    palette: null,
    type: { font: "heading", weight: "400", headlineSize: 1.3, tracking: 0 },
    motion: { spring: true, ease: 0.42 },
  },
  "rising-diagonal": {
    headline: ["TWELVE WORKS", "IN SLOW ORBIT"],
    headlineWidths: [1846, 2000],
    axis: 25.5,
    phase: 93,
    direction: 1,
    field: "matte",
    palette: [
      "#e9e5dd",
      "#20232a",
      "#c25a43",
      "#2f5b4e",
      "#d6cfc2",
      "#3a4763",
      "#dda45c",
      "#14161a",
      "#a7b3a4",
      "#f3f1ec",
      "#5a6670",
      "#8c4b3f",
    ],
    type: { font: "sans", weight: "400", headlineSize: 1.15, tracking: 0.1 },
    motion: { spring: true, ease: 0.42 },
  },
  "falling-diagonal": {
    headline: ["SIGNAL LOST", "IMAGE HOLDING"],
    headlineWidths: [1622, 1917],
    axis: -25.5,
    phase: 87,
    direction: -1,
    field: "glitch",
    palette: [
      "#0b0b12",
      "#ff2f6d",
      "#00e6ff",
      "#13f28a",
      "#f2f2f8",
      "#7a1bff",
      "#101018",
      "#ff7a1a",
      "#141a2e",
      "#e01f52",
      "#1a1a26",
      "#0ac2d8",
    ],
    type: { font: "sans", weight: "700", headlineSize: 1.2, tracking: 0 },
    motion: { spring: false, ease: 0.12 },
  },
  "horizontal-sweep": {
    headline: ["PRINTS FROM", "THE FLAT FILES"],
    headlineWidths: [1506, 1917],
    axis: 0,
    phase: 90,
    direction: 1,
    field: "riso",
    palette: [
      "#e0b64a",
      "#b1512a",
      "#6d7638",
      "#ecdfc2",
      "#2f6b66",
      "#8a3a2b",
      "#d69b3e",
      "#3c4630",
      "#c06e3a",
      "#e6d3a8",
      "#546d76",
      "#7a4726",
    ],
    type: { font: "oldstyle", weight: "700", headlineSize: 1.2, tracking: 0.03 },
    motion: { spring: false, ease: 0.9 },
  },
  "vertical-loop": {
    headline: ["ONE WALL", "TWELVE PLATES"],
    headlineWidths: [1132, 1840],
    axis: 90,
    phase: 0,
    direction: -1,
    field: "halftone",
    palette: [
      "#12110f",
      "#f2efe8",
      "#1c1b18",
      "#e4e0d7",
      "#2b2a26",
      "#d6d1c6",
      "#0a0a09",
      "#faf8f3",
      "#1f1e1a",
      "#eae6dd",
      "#161513",
      "#c0402c",
    ],
    type: { font: "didone", weight: "400", headlineSize: 1.25, tracking: 0.06 },
    motion: { spring: false, ease: 0.55 },
  },
} as const;

const FONTS = {
  heading: "", // resolved from --font-heading at runtime
  serif: '"Times New Roman",Times,"Liberation Serif","Nimbus Roman",serif',
  didone: 'Didot,"Bodoni 72","Bodoni MT","Playfair Display",Georgia,serif',
  oldstyle: '"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif',
  sans: '"Helvetica Neue",Helvetica,"Inter",Arial,system-ui,sans-serif',
} as const;

export type SalonBannerVariant = keyof typeof VARIANTS;
export type SalonBannerFont = keyof typeof FONTS;

export interface SalonBannerProps {
  className?: string;
  /** Which gallery: tonal (theme plates), or the original matte, glitch, riso and halftone galleries. */
  variant?: SalonBannerVariant;
  /** Two-line headline, split on "\n". Defaults to the variant's own headline. */
  text?: string;
  /** Headline face. Defaults to the variant's face. */
  font?: SalonBannerFont;
  /** Headline weight. Defaults to the variant's weight. */
  weight?: "400" | "700";
  /** Headline size multiplier, 0.6–1.8. Defaults to the variant's size. */
  headlineSize?: number;
  /** Twelve plate colours (any CSS colour). Defaults to the variant's palette; tonal mixes them from the theme. */
  colors?: string[];
  /** Stage colour (any CSS colour). Defaults to hsl(var(--background)). */
  backgroundColor?: string;
  /** Final-frame grade, in degrees. */
  hue?: number;
  saturation?: number;
  brightness?: number;
}

type Ctx = CanvasRenderingContext2D;
type RGB = number[];

/* design frame: 2962 x 2160; every length below is in that space */
const DW = 2962;
const DH = 2160;
const DASP = DW / DH;
const DUR = 15.015; /* one full revolution */
const TS = 512; /* texture resolution */
const HEAD_CAP = 142;
const HEAD_MID = 1093;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}
function mkc(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
/* plates arrive as resolved "rgb(r, g, b)" strings */
const rgbOf = (color: string): RGB =>
  (color.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number);
/* resolves any CSS colour (including hsl(var(--token))) to "rgb(r, g, b)" */
function resolveColor(el: HTMLElement, color: string) {
  const probe = document.createElement("span");
  probe.style.color = color;
  probe.style.display = "none";
  el.appendChild(probe);
  const out = getComputedStyle(probe).color;
  probe.remove();
  return out;
}
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const cssRGB = (c: RGB) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const luma = (c: RGB) => (c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114) / 255;

/* value noise on a 64x64 lattice, smoothstep-interpolated and wrapped */
function noiseField(seed: number) {
  const g = new Float32Array(4096);
  const r = rng(seed);
  for (let i = 0; i < 4096; i++) g[i] = r();
  return (x: number, y: number) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    let fx = x - x0;
    let fy = y - y0;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const ra = (y0 & 63) * 64;
    const rb = ((y0 + 1) & 63) * 64;
    const ca = x0 & 63;
    const cb = (x0 + 1) & 63;
    const a = g[ra + ca];
    const b = g[ra + cb];
    const c = g[rb + ca];
    const d = g[rb + cb];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}
type Noise = ReturnType<typeof noiseField>;
function fbm(n: Noise, x: number, y: number, oct: number) {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  let tot = 0;
  for (let i = 0; i < oct; i++) {
    v += amp * n(x * f, y * f);
    tot += amp;
    amp *= 0.5;
    f *= 2;
  }
  return v / tot;
}

let grainTileCache: HTMLCanvasElement | null = null;
function grainTile() {
  if (grainTileCache) return grainTileCache;
  const c = mkc(160, 160);
  const x = c.getContext("2d")!;
  const d = x.createImageData(160, 160);
  const r = rng(0x51f3);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 128 + (r() - 0.5) * 116;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  grainTileCache = c;
  return c;
}
function fill(x: Ctx, style: string) {
  x.fillStyle = style;
  x.fillRect(0, 0, TS, TS);
}
function grain(x: Ctx, alpha: number) {
  x.save();
  x.globalCompositeOperation = "overlay";
  x.globalAlpha = alpha;
  x.fillStyle = x.createPattern(grainTile(), "repeat")!;
  x.fillRect(0, 0, TS, TS);
  x.restore();
}
/* paint a low-resolution field, then blow it up over the whole tile */
function fieldBuffer(N: number, shade: (u: number, v: number, px: number, py: number) => number[]) {
  const buf = mkc(N, N);
  const bx = buf.getContext("2d")!;
  const d = bx.createImageData(N, N);
  for (let py = 0; py < N; py++) {
    for (let px = 0; px < N; px++) {
      const c = shade((px + 0.5) / N, (py + 0.5) / N, px, py);
      const o = (py * N + px) * 4;
      d.data[o] = c[0] | 0;
      d.data[o + 1] = c[1] | 0;
      d.data[o + 2] = c[2] | 0;
      d.data[o + 3] = c.length > 3 ? c[3] | 0 : 255;
    }
  }
  bx.putImageData(d, 0, 0);
  return buf;
}
function blowUp(x: Ctx, buf: HTMLCanvasElement, smooth: boolean, alpha?: number) {
  x.save();
  x.imageSmoothingEnabled = smooth;
  if (alpha !== undefined) x.globalAlpha = alpha;
  x.drawImage(buf, 0, 0, TS, TS);
  x.restore();
}

/* matte — flat colour, one slow rise of noise, fine grain */
function paintMatte(x: Ctx, base: RGB, i: number) {
  const n = noiseField(0x2c41 + i * 9176);
  const hi = mixRGB(base, [255, 255, 255], 0.13);
  const lo = mixRGB(base, [0, 0, 0], 0.15);
  blowUp(
    x,
    fieldBuffer(160, (u, v) => {
      let s = 0.5 + (fbm(n, u * 6.5, v * 6.5, 5) - 0.5) * 1.9 + (v - 0.5) * 0.07;
      s = s < 0 ? 0 : s > 1 ? 1 : s;
      return s < 0.5 ? mixRGB(lo, base, s * 2) : mixRGB(base, hi, (s - 0.5) * 2);
    }),
    true,
  );
  grain(x, 0.1);
}

/* glitch — flat blocks torn from neighbours, rows slipped, channels off register */
function paintGlitch(x: Ctx, base: RGB, i: number, plates: readonly string[]) {
  const r = rng(0x51b7 + i * 30011);
  fill(x, cssRGB(base));
  for (let k = 0; k < 4; k++) {
    x.fillStyle = cssRGB(rgbOf(plates[(i + 1 + ((r() * 5) | 0)) % plates.length]));
    x.fillRect(
      Math.round((r() - 0.2) * TS),
      Math.round(r() * TS),
      Math.round((0.2 + r() * 0.55) * TS),
      Math.round((0.04 + r() * 0.2) * TS),
    );
  }
  blowUp(
    x,
    fieldBuffer(64, () => {
      const w = r() < 0.5 ? 250 : 6;
      return [w, w, w, r() < 0.2 ? 200 : 0];
    }),
    false,
    0.5,
  );
  const snap = mkc(TS, TS);
  snap.getContext("2d")!.drawImage(x.canvas, 0, 0);
  for (let k = 0; k < 11; k++) {
    const y0 = Math.round(r() * TS);
    const h = Math.round((0.01 + r() * 0.06) * TS);
    const dx = Math.round((r() - 0.5) * 0.36 * TS);
    x.clearRect(0, y0, TS, h);
    x.drawImage(snap, 0, y0, TS, h, dx, y0, TS, h);
    x.drawImage(snap, 0, y0, TS, h, dx + (dx < 0 ? TS : -TS), y0, TS, h);
  }
  const channel = (color: string) => {
    const g = mkc(TS, TS);
    const gx = g.getContext("2d")!;
    gx.drawImage(x.canvas, 0, 0);
    gx.globalCompositeOperation = "multiply";
    gx.fillStyle = color;
    gx.fillRect(0, 0, TS, TS);
    return g;
  };
  const red = channel("#ff3050");
  const cyan = channel("#30e0ff");
  x.save();
  x.globalCompositeOperation = "lighter";
  x.globalAlpha = 0.3;
  x.drawImage(red, -0.022 * TS, 0);
  x.drawImage(cyan, 0.022 * TS, 0);
  x.restore();
  x.save();
  x.fillStyle = "rgba(0,0,0,0.22)";
  for (let k = 0; k < TS; k += 4) x.fillRect(0, k, TS, 1);
  x.restore();
  grain(x, 0.24);
}

/* riso — a lit corner and noise quantised to three tones through an ordered dither */
function paintRiso(x: Ctx, base: RGB, i: number) {
  const n = noiseField(0x77a3 + i * 15731);
  const lo = mixRGB(base, [24, 14, 6], 0.66);
  const hi = mixRGB(base, [255, 238, 196], 0.5);
  const cx = 0.22 + (i % 3) * 0.28;
  const cy = 0.2 + ((i / 3) | 0) * 0.2;
  blowUp(
    x,
    fieldBuffer(100, (u, v, px, py) => {
      const d = Math.sqrt((u - cx) * (u - cx) + (v - cy) * (v - cy));
      const s = (1 - d * 1.25) * 0.72 + fbm(n, u * 3.2, v * 3.2, 3) * 0.52 - 0.1;
      const band = Math.floor(s * 2.4 + (BAYER[(py & 3) * 4 + (px & 3)] + 0.5) / 16);
      return band <= 0 ? lo : band === 1 ? base : hi;
    }),
    false,
  );
  x.save();
  x.fillStyle = "rgba(28,14,4,0.18)";
  for (let k = 0; k < TS; k += 6) x.fillRect(0, k, TS, 2);
  x.restore();
  grain(x, 0.22);
}

/* halftone — one ink on one stock, shaded only by dot size */
function paintHalftone(x: Ctx, base: RGB, i: number) {
  const n = noiseField(0x3f19 + i * 21467);
  fill(x, cssRGB(base));
  const dot = luma(base) > 0.5 ? mixRGB(base, [0, 0, 0], 0.88) : mixRGB(base, [255, 255, 255], 0.9);
  const pitch = TS / 30;
  const a = ((17 + (i % 4) * 9) * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const span = Math.ceil(TS / pitch);
  x.save();
  x.fillStyle = cssRGB(dot);
  x.translate(TS / 2, TS / 2);
  x.rotate(a);
  for (let gy = -span; gy <= span; gy++) {
    for (let gx = -span; gx <= span; gx++) {
      const wx = gx * pitch;
      const wy = gy * pitch;
      const u = (wx * ca - wy * sa) / TS + 0.5;
      const v = (wx * sa + wy * ca) / TS + 0.5;
      if (u < -0.1 || u > 1.1 || v < -0.1 || v > 1.1) continue;
      const s = fbm(n, u * 2.7, v * 2.7, 4) * 0.95 + (0.55 - v) * 0.5;
      const rad = pitch * 0.66 * (s < 0 ? 0 : s > 1 ? 1 : s);
      if (rad < 0.4) continue;
      x.beginPath();
      x.arc(wx, wy, rad, 0, Math.PI * 2);
      x.fill();
    }
  }
  x.restore();
  grain(x, 0.12);
}

function roundRectPath(x: Ctx, w: number, h: number, r: number) {
  x.beginPath();
  x.moveTo(-w / 2 + r, -h / 2);
  x.lineTo(w / 2 - r, -h / 2);
  x.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  x.lineTo(w / 2, h / 2 - r);
  x.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  x.lineTo(-w / 2 + r, h / 2);
  x.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  x.lineTo(-w / 2, -h / 2 + r);
  x.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  x.closePath();
}

/* draw text whose inked box matches a cap height and (optional) width */
function fitText(
  x: Ctx,
  str: string,
  font: string,
  weight: string,
  cap: number,
  cx: number,
  capTop: number,
  targetW: number,
  color: string,
) {
  const probe = 100;
  x.font = `${weight} ${probe}px ${font}`;
  const m = x.measureText("H");
  const capUnit = (m.actualBoundingBoxAscent || 71) / probe;
  const size = cap / capUnit;
  x.font = `${weight} ${size}px ${font}`;
  const mm = x.measureText(str);
  const inkW = (mm.actualBoundingBoxRight || mm.width) + (mm.actualBoundingBoxLeft || 0);
  const sx = targetW ? targetW / inkW : 1;
  x.save();
  x.fillStyle = color;
  x.textBaseline = "alphabetic";
  x.translate(cx, capTop + cap);
  x.scale(sx, 1);
  x.textAlign = "center";
  x.fillText(str, 0, 0);
  x.restore();
}

export function SalonBanner({
  className,
  variant = "tonal",
  text,
  font,
  weight,
  headlineSize,
  colors,
  backgroundColor,
  hue = 0,
  saturation = 1,
  brightness = 1,
}: SalonBannerProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const v = VARIANTS[variant] ?? VARIANTS.tonal;
  const background = backgroundColor ?? "hsl(var(--background))";
  const plateKey = (colors ?? v.palette ?? []).join("|");
  /* re-resolve the theme tokens whenever the mode or palette on <html> changes */
  const [theme, setTheme] = useState(0);
  useEffect(() => {
    const mo = new MutationObserver(() => setTheme((t) => t + 1));
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const cv = canvasRef.current;
    if (!host || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const token = (name: string) => rgbOf(resolveColor(host, `hsl(var(--${name}))`));
    const fg = token("foreground");
    const bg = token("background");
    const pr = token("primary");
    const mu = token("muted");
    /* tonal plates: a ladder from the page through muted and primary to the ink */
    const TONAL = [
      mixRGB(bg, pr, 0.12),
      mixRGB(pr, fg, 0.4),
      mixRGB(mu, pr, 0.35),
      pr,
      mixRGB(bg, mu, 0.7),
      mixRGB(pr, bg, 0.45),
      mixRGB(fg, bg, 0.12),
      mixRGB(mu, fg, 0.25),
      mixRGB(pr, bg, 0.7),
      mixRGB(pr, fg, 0.7),
      mixRGB(bg, pr, 0.3),
      mixRGB(mu, bg, 0.4),
    ].map(cssRGB);
    const PLATES = plateKey ? plateKey.split("|").map((c) => resolveColor(host, c)) : TONAL;
    const BG = resolveColor(host, background);
    const ink = [
      resolveColor(host, "hsl(var(--muted-foreground))"),
      resolveColor(host, "hsl(var(--foreground))"),
      BG,
    ];
    const fontKey = font ?? v.type.font;
    const SANS = fontKey === "heading" ? getComputedStyle(cv).fontFamily : FONTS[fontKey];
    const HEAD_WEIGHT = weight ?? v.type.weight;
    const HEAD_SIZE = Math.max(0.6, Math.min(1.8, headlineSize ?? v.type.headlineSize));
    const HEAD_TRACK = v.type.tracking;
    const HEAD_STYLE = v.field;
    const HEAD_SHADOW = ink[2];
    const HEAD_GHOST = [cssRGB(pr), resolveColor(host, "hsl(var(--muted-foreground))")];
    const EASE = v.motion.ease;
    const SPRING = v.motion.spring;
    const SPRING_K = 26;
    const SPRING_D = 5.7;
    const custom = text?.split("\n");
    const HEAD = [
      {
        s: custom ? (custom[0] ?? "") : v.headline[0],
        top: 930,
        w: custom ? 0 : v.headlineWidths[0],
        fill: ink[0],
      },
      {
        s: custom ? (custom[1] ?? "") : v.headline[1],
        top: 1114,
        w: custom ? 0 : v.headlineWidths[1],
        fill: ink[1],
      },
    ];
    const RING = {
      cx: 1484,
      cy: 1108,
      a: 712,
      ratio: 0.492,
      axis: v.axis,
      n: 12,
      tile: 346,
      aspect: 0.75 /* 4:3 landscape crop */,
      radius: 0.22,
      dist: 13,
      phase: v.phase,
    };

    /* plates: front face, and a darker washed-out reverse */
    const painter = (x: Ctx, i: number) => {
      const base = rgbOf(PLATES[i]);
      if (HEAD_STYLE === "glitch") paintGlitch(x, base, i, PLATES);
      else if (HEAD_STYLE === "riso") paintRiso(x, base, i);
      else if (HEAD_STYLE === "halftone") paintHalftone(x, base, i);
      else paintMatte(x, base, i);
    };
    const front: HTMLCanvasElement[] = [];
    const back: HTMLCanvasElement[] = [];
    for (let i = 0; i < PLATES.length; i++) {
      const c = mkc(TS, TS);
      painter(c.getContext("2d")!, i);
      front.push(c);
      const d = mkc(TS, TS);
      const y = d.getContext("2d")!;
      y.drawImage(c, 0, 0);
      y.globalCompositeOperation = "saturation";
      y.fillStyle = "rgba(128,128,128,0.2)";
      y.fillRect(0, 0, TS, TS);
      y.globalCompositeOperation = "multiply";
      y.fillStyle = "rgba(10,12,24,0.45)";
      y.fillRect(0, 0, TS, TS);
      back.push(d);
    }

    const ax = (RING.axis * Math.PI) / 180;
    const cf = RING.ratio;
    const sf = Math.sqrt(1 - cf * cf);
    const U = [Math.cos(ax), Math.sin(ax), 0];
    const V = [-Math.sin(ax) * cf, Math.cos(ax) * cf, sf];
    const AXIS = [U[1] * V[2] - U[2] * V[1], U[2] * V[0] - U[0] * V[2], U[0] * V[1] - U[1] * V[0]];

    let W = 0;
    let H = 0;
    let K = 1;
    let OX = 0;
    let OY = 0;
    let headLayer: HTMLCanvasElement = mkc(1, 1);
    const d2sx = (x: number) => OX + x * K;
    const d2sy = (y: number) => OY + y * K;

    function headPass(x: Ctx, dx: number, dy: number, tint: string | null) {
      for (const h of HEAD) {
        fitText(
          x,
          h.s,
          SANS,
          HEAD_WEIGHT,
          HEAD_CAP * HEAD_SIZE * K,
          d2sx(1481) + dx,
          d2sy(HEAD_MID + (h.top - HEAD_MID) * HEAD_SIZE) + dy,
          h.w * HEAD_SIZE * K,
          tint || h.fill,
        );
      }
    }
    function headGlitch(x: Ctx) {
      const w = headLayer.width;
      const h = headLayer.height;
      const snap = mkc(w, h);
      snap.getContext("2d")!.drawImage(headLayer, 0, 0);
      const r = rng(0x2e51);
      const top = d2sy(HEAD_MID) - HEAD_CAP * HEAD_SIZE * K * 2.1;
      const span = HEAD_CAP * HEAD_SIZE * K * 4.2;
      for (let i = 0; i < 7; i++) {
        const sy = Math.round(top + r() * span);
        const sh = Math.round((0.03 + r() * 0.11) * HEAD_CAP * HEAD_SIZE * K);
        const dx = Math.round((r() - 0.5) * 0.08 * w);
        x.clearRect(0, sy, w, sh);
        x.drawImage(snap, 0, sy, w, sh, dx, sy, w, sh);
      }
      const ghost = (color: string) => {
        const g = mkc(w, h);
        const gx = g.getContext("2d")!;
        gx.drawImage(snap, 0, 0);
        gx.globalCompositeOperation = "source-in";
        gx.fillStyle = color;
        gx.fillRect(0, 0, w, h);
        return g;
      };
      const off = 0.05 * HEAD_CAP * HEAD_SIZE * K;
      x.save();
      x.globalCompositeOperation = "destination-over";
      x.globalAlpha = 0.9;
      x.drawImage(ghost(HEAD_GHOST[0]), -off, 0);
      x.drawImage(ghost(HEAD_GHOST[1]), off, 0);
      x.restore();
    }
    function buildHead() {
      headLayer = mkc(Math.max(1, W), Math.max(1, H));
      const x = headLayer.getContext("2d")!;
      if (x.letterSpacing !== undefined)
        x.letterSpacing = `${(HEAD_TRACK * HEAD_CAP * HEAD_SIZE * K).toFixed(2)}px`;
      if (HEAD_STYLE === "riso") {
        const off = 0.055 * HEAD_CAP * HEAD_SIZE * K;
        headPass(x, off, off, HEAD_SHADOW);
      }
      headPass(x, 0, 0, null);
      if (HEAD_STYLE === "glitch") headGlitch(x);
    }
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(host!.clientWidth * dpr));
      H = Math.max(1, Math.round(host!.clientHeight * dpr));
      cv!.width = W;
      cv!.height = H;
      const S = Math.min(W, H * DASP);
      K = S / DW;
      OX = (W - DW * K) / 2;
      OY = (H - DH * K) / 2;
      buildHead();
    }
    function project(p: number[]) {
      const k = (RING.a * K * RING.dist) / (RING.dist - p[2]);
      return [d2sx(RING.cx) + k * p[0], d2sy(RING.cy) + k * p[1], k];
    }
    function drawTile(i: number, psi: number) {
      const c = Math.cos(psi);
      const s = Math.sin(psi);
      const C = [c * U[0] + s * V[0], c * U[1] + s * V[1], c * U[2] + s * V[2]];
      const T = [-s * U[0] + c * V[0], -s * U[1] + c * V[1], -s * U[2] + c * V[2]];
      const h = RING.tile / (2 * RING.a);
      const p0 = project(C);
      const pT = project([C[0] + T[0] * h, C[1] + T[1] * h, C[2] + T[2] * h]);
      const pA = project([C[0] + AXIS[0] * h, C[1] + AXIS[1] * h, C[2] + AXIS[2] * h]);
      const ex = pT[0] - p0[0];
      const ey = pT[1] - p0[1];
      const fx = pA[0] - p0[0];
      const fy = pA[1] - p0[1];
      if (Math.abs(ex * fy - ey * fx) < 0.4) return;
      const img = (C[2] > 0 ? front : back)[i % front.length];
      ctx!.save();
      ctx!.setTransform((ex * 2) / TS, (ey * 2) / TS, (fx * 2) / TS, (fy * 2) / TS, p0[0], p0[1]);
      roundRectPath(ctx!, TS, TS * RING.aspect, TS * RING.aspect * RING.radius);
      ctx!.clip();
      ctx!.drawImage(img, -TS / 2, -TS / 2, TS, TS);
      ctx!.restore();
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
    }
    function render(t: number) {
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.fillStyle = BG;
      ctx!.fillRect(0, 0, W, H);
      ctx!.imageSmoothingQuality = "high";
      const spin = (t / DUR) * Math.PI * 2 * v.direction;
      const list: { i: number; psi: number; z: number }[] = [];
      for (let i = 0; i < RING.n; i++) {
        const psi = (RING.phase * Math.PI) / 180 - (i * 2 * Math.PI) / RING.n + spin;
        list.push({ i, psi, z: Math.cos(psi) * U[2] + Math.sin(psi) * V[2] });
      }
      list.sort((a, b) => a.z - b.z);
      let drawnText = false;
      for (const item of list) {
        if (!drawnText && item.z > 0) {
          ctx!.drawImage(headLayer, 0, 0);
          drawnText = true;
        }
        drawTile(item.i, item.psi);
      }
      if (!drawnText) ctx!.drawImage(headLayer, 0, 0);
    }

    /* the ring rests, and orbits only while a pointer is over it; matte is sprung */
    let tNow = 0;
    let hovering = false;
    let rate = 0;
    let vel = 0;
    let settled = false;
    let last = performance.now();
    let raf = 0;
    let visible = true;
    const reduce = !!prefersReducedMotion;
    const setHover = (state: boolean) => {
      if (hovering === state || reduce) return;
      hovering = state;
      settled = false;
      start();
    };
    function frame(now: number) {
      raf = 0;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (SPRING) {
        vel += (((hovering ? 1 : 0) - rate) * SPRING_K - vel * SPRING_D) * dt;
        rate += vel * dt;
      } else {
        rate += ((hovering ? 1 : 0) - rate) * (1 - Math.exp(-dt / EASE));
      }
      if (Math.abs(rate) > 0.0004 || Math.abs(vel) > 0.0004) {
        tNow = (((tNow + dt * rate) % DUR) + DUR) % DUR;
        render(tNow);
        settled = false;
      } else if (!settled) {
        rate = 0;
        vel = 0;
        render(tNow);
        settled = true;
      }
      if (!settled || hovering) raf = requestAnimationFrame(frame);
    }
    function start() {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    const onEnter = () => setHover(true);
    const onLeave = () => setHover(false);
    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointermove", onEnter);
    host.addEventListener("pointerdown", onEnter);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointercancel", onLeave);
    window.addEventListener("blur", onLeave);

    resize();
    render(tNow);
    const ro = new ResizeObserver(() => {
      resize();
      render(tNow);
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && (hovering || !settled)) start();
      else if (!visible) stop();
    });
    io.observe(host);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointermove", onEnter);
      host.removeEventListener("pointerdown", onEnter);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointercancel", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [v, theme, background, plateKey, text, font, weight, headlineSize, prefersReducedMotion]);

  const safeHue = Math.min(180, Math.max(-180, hue));
  const safeSaturation = Math.min(2, Math.max(0, saturation));
  const safeBrightness = Math.min(1.65, Math.max(0.35, brightness));
  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;
  const headline = text ?? v.headline.join("\n");

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 h-full w-full overflow-hidden", className)}
      style={{ background, filter }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full font-serif" />
      <h2 className="sr-only">{headline.replace(/\n/g, " ")}</h2>
    </div>
  );
}
