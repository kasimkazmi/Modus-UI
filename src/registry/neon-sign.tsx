"use client";
// Ported from ThreeUI Community's Neon Sign (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface NeonSignProps {
  className?: string;
  /** Lettering; "\n" starts a new line. Each line is justified to the widest one. */
  text?: string;
  /** "dark" lights the tubes on black; "light" inverts them onto paper. */
  mode?: "dark" | "light";
  /** ThreeUI grades the sign to grayscale. Set false to see the pink glass. */
  monochrome?: boolean;
  /** Stage colour. Defaults to the mode's background. */
  backgroundColor?: string;
  /** Final-frame grade, in degrees. */
  hue?: number;
  saturation?: number;
  brightness?: number;
}

type Cmd = (string | number)[];
type Sub = { c: Cmd[]; closed?: number };
type Glyph = { w: number; sub: Sub[] };
type Item = { g: Glyph; ox: number; oy: number; s: number };

const P = Math.PI;

/* The authored glass tubing for G L A S B O W N, kept exactly. */
const AUTHORED: Record<string, Glyph> = {
  G: {
    w: 0.88,
    sub: [
      {
        c: [
          ["M", 0.7946, 0.232],
          ["E", 0.44, 0.5, 0.42, 0.5, -0.18 * P, -1.87 * P, 1],
          ["Q", 0.902, 0.606, 0.86, 0.492],
          ["L", 0.47, 0.492],
        ],
      },
    ],
  },
  L: {
    w: 0.6,
    sub: [
      {
        c: [
          ["M", 0.09, 0.0],
          ["L", 0.09, 0.66],
          ["R", 0.09, 1.0, 0.6, 1.0, 0.2],
          ["L", 0.575, 1.0],
        ],
      },
    ],
  },
  A: {
    w: 0.9,
    sub: [
      {
        c: [
          ["M", 0.04, 1.0],
          ["R", 0.45, 0.0, 0.86, 1.0, 0.105],
          ["L", 0.86, 1.0],
        ],
      },
      {
        c: [
          ["M", 0.174, 0.665],
          ["L", 0.726, 0.665],
        ],
      },
    ],
  },
  S: {
    w: 0.74,
    sub: [
      {
        c: [
          ["M", 0.588, 0.0478],
          ["E", 0.4, 0.25, 0.32, 0.25, -0.3 * P, 0.5 * P, 1],
          ["E", 0.4, 0.75, 0.32, 0.25, -0.5 * P, 0.86 * P, 0],
        ],
      },
    ],
  },
  B: {
    w: 0.74,
    sub: [
      {
        c: [
          ["M", 0.09, 0.0],
          ["L", 0.09, 1.0],
        ],
      },
      {
        c: [
          ["M", 0.09, 0.0],
          ["L", 0.28, 0.0],
          ["E", 0.28, 0.25, 0.34, 0.25, -0.5 * P, 0.5 * P, 0],
          ["L", 0.09, 0.5],
        ],
      },
      {
        c: [
          ["M", 0.09, 0.5],
          ["L", 0.3, 0.5],
          ["E", 0.3, 0.75, 0.38, 0.25, -0.5 * P, 0.5 * P, 0],
          ["L", 0.09, 1.0],
        ],
      },
    ],
  },
  O: {
    w: 0.9,
    sub: [
      {
        closed: 1,
        c: [
          ["M", 0.46, 0.0],
          ["E", 0.46, 0.5, 0.42, 0.5, -0.5 * P, 1.5 * P, 0],
        ],
      },
    ],
  },
  W: {
    w: 1.09,
    sub: [
      {
        c: [
          ["M", 0.03, 0.0],
          ["R", 0.24, 1.0, 0.545, 0.3, 0.07],
          ["R", 0.545, 0.3, 0.85, 1.0, 0.07],
          ["R", 0.85, 1.0, 1.06, 0.0, 0.07],
          ["L", 1.06, 0.0],
        ],
      },
    ],
  },
  N: {
    w: 0.88,
    sub: [
      {
        c: [
          ["M", 0.08, 1.0],
          ["R", 0.08, 0.0, 0.84, 1.0, 0.075],
          ["R", 0.84, 1.0, 0.84, 0.0, 0.075],
          ["L", 0.84, 0.0],
        ],
      },
    ],
  },
};

/* The rest of the alphabet, bent in the same single-stroke tubing so any text can be set. */
const EXTENDED: Record<string, Glyph> = {
  C: {
    w: 0.84,
    sub: [
      {
        c: [
          ["M", 0.7836, 0.2061],
          ["E", 0.46, 0.5, 0.4, 0.5, -0.2 * P, -1.8 * P, 1],
        ],
      },
    ],
  },
  D: {
    w: 0.8,
    sub: [
      {
        c: [
          ["M", 0.09, 0.0],
          ["L", 0.09, 1.0],
        ],
      },
      {
        c: [
          ["M", 0.09, 0.0],
          ["L", 0.3, 0.0],
          ["E", 0.3, 0.5, 0.42, 0.5, -0.5 * P, 0.5 * P, 0],
          ["L", 0.09, 1.0],
        ],
      },
    ],
  },
  E: {
    w: 0.66,
    sub: [
      {
        c: [
          ["M", 0.6, 0.0],
          ["L", 0.09, 0.0],
          ["L", 0.09, 1.0],
          ["L", 0.6, 1.0],
        ],
      },
      {
        c: [
          ["M", 0.09, 0.5],
          ["L", 0.52, 0.5],
        ],
      },
    ],
  },
  F: {
    w: 0.62,
    sub: [
      {
        c: [
          ["M", 0.58, 0.0],
          ["L", 0.09, 0.0],
          ["L", 0.09, 1.0],
        ],
      },
      {
        c: [
          ["M", 0.09, 0.5],
          ["L", 0.5, 0.5],
        ],
      },
    ],
  },
  H: {
    w: 0.82,
    sub: [
      {
        c: [
          ["M", 0.09, 0.0],
          ["L", 0.09, 1.0],
        ],
      },
      {
        c: [
          ["M", 0.73, 0.0],
          ["L", 0.73, 1.0],
        ],
      },
      {
        c: [
          ["M", 0.09, 0.5],
          ["L", 0.73, 0.5],
        ],
      },
    ],
  },
  I: {
    w: 0.3,
    sub: [
      {
        c: [
          ["M", 0.15, 0.0],
          ["L", 0.15, 1.0],
        ],
      },
    ],
  },
  J: {
    w: 0.58,
    sub: [
      {
        c: [
          ["M", 0.48, 0.0],
          ["L", 0.48, 0.72],
          ["E", 0.27, 0.72, 0.21, 0.28, 0, P, 0],
        ],
      },
    ],
  },
  K: {
    w: 0.76,
    sub: [
      {
        c: [
          ["M", 0.09, 0.0],
          ["L", 0.09, 1.0],
        ],
      },
      {
        c: [
          ["M", 0.68, 0.0],
          ["L", 0.09, 0.62],
        ],
      },
      {
        c: [
          ["M", 0.3, 0.42],
          ["L", 0.7, 1.0],
        ],
      },
    ],
  },
  M: {
    w: 1.0,
    sub: [
      {
        c: [
          ["M", 0.08, 1.0],
          ["R", 0.08, 0.0, 0.5, 0.62, 0.075],
          ["R", 0.5, 0.62, 0.92, 0.0, 0.075],
          ["R", 0.92, 0.0, 0.92, 1.0, 0.075],
          ["L", 0.92, 1.0],
        ],
      },
    ],
  },
  P: {
    w: 0.72,
    sub: [
      {
        c: [
          ["M", 0.09, 1.0],
          ["L", 0.09, 0.0],
          ["L", 0.3, 0.0],
          ["E", 0.3, 0.26, 0.34, 0.26, -0.5 * P, 0.5 * P, 0],
          ["L", 0.09, 0.52],
        ],
      },
    ],
  },
  Q: {
    w: 0.9,
    sub: [
      {
        closed: 1,
        c: [
          ["M", 0.46, 0.0],
          ["E", 0.46, 0.5, 0.42, 0.5, -0.5 * P, 1.5 * P, 0],
        ],
      },
      {
        c: [
          ["M", 0.56, 0.7],
          ["L", 0.86, 1.0],
        ],
      },
    ],
  },
  R: {
    w: 0.74,
    sub: [
      {
        c: [
          ["M", 0.09, 1.0],
          ["L", 0.09, 0.0],
          ["L", 0.3, 0.0],
          ["E", 0.3, 0.26, 0.34, 0.26, -0.5 * P, 0.5 * P, 0],
          ["L", 0.09, 0.52],
        ],
      },
      {
        c: [
          ["M", 0.36, 0.52],
          ["L", 0.68, 1.0],
        ],
      },
    ],
  },
  T: {
    w: 0.72,
    sub: [
      {
        c: [
          ["M", 0.04, 0.0],
          ["L", 0.68, 0.0],
        ],
      },
      {
        c: [
          ["M", 0.36, 0.0],
          ["L", 0.36, 1.0],
        ],
      },
    ],
  },
  U: {
    w: 0.82,
    sub: [
      {
        c: [
          ["M", 0.09, 0.0],
          ["L", 0.09, 0.6],
          ["E", 0.41, 0.6, 0.32, 0.4, P, 0, 1],
          ["L", 0.73, 0.0],
        ],
      },
    ],
  },
  V: {
    w: 0.86,
    sub: [
      {
        c: [
          ["M", 0.04, 0.0],
          ["R", 0.43, 1.0, 0.82, 0.0, 0.07],
          ["L", 0.82, 0.0],
        ],
      },
    ],
  },
  X: {
    w: 0.8,
    sub: [
      {
        c: [
          ["M", 0.06, 0.0],
          ["L", 0.74, 1.0],
        ],
      },
      {
        c: [
          ["M", 0.74, 0.0],
          ["L", 0.06, 1.0],
        ],
      },
    ],
  },
  Y: {
    w: 0.8,
    sub: [
      {
        c: [
          ["M", 0.05, 0.0],
          ["L", 0.4, 0.5],
          ["L", 0.75, 0.0],
        ],
      },
      {
        c: [
          ["M", 0.4, 0.5],
          ["L", 0.4, 1.0],
        ],
      },
    ],
  },
  Z: {
    w: 0.74,
    sub: [
      {
        c: [
          ["M", 0.08, 0.0],
          ["L", 0.66, 0.0],
          ["L", 0.08, 1.0],
          ["L", 0.68, 1.0],
        ],
      },
    ],
  },
  " ": { w: 0.45, sub: [] },
};

const GLYPHS: Record<string, Glyph> = { ...EXTENDED, ...AUTHORED };
const DEFAULT_TEXT = "GLASS\nBLOWN";
const MINGAP = 0.17;
const LINEGAP = 0.46;
const AUTHORED_FLICK = { line: 1, i: 3 };
const AUTHORED_ELECTRODES = [
  { line: 0, i: 0, p: [0.7946, 0.232], a: -0.95 },
  { line: 0, i: 4, p: [0.11, 0.856], a: 2.45 },
  { line: 1, i: 0, p: [0.09, 1.0], a: 2.6 },
  { line: 1, i: 4, p: [0.84, 0.0], a: -1.45 },
];
const SPILL_S = 0.34;
const BLOOM_S = 0.5;

function mk(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}
function emit(x: CanvasRenderingContext2D, sp: Sub, ox: number, oy: number, s: number) {
  for (const c of sp.c) {
    const k = c[0];
    const n = c as number[];
    if (k === "M") x.moveTo(ox + n[1] * s, oy + n[2] * s);
    else if (k === "L") x.lineTo(ox + n[1] * s, oy + n[2] * s);
    else if (k === "Q")
      x.quadraticCurveTo(ox + n[1] * s, oy + n[2] * s, ox + n[3] * s, oy + n[4] * s);
    else if (k === "R")
      x.arcTo(ox + n[1] * s, oy + n[2] * s, ox + n[3] * s, oy + n[4] * s, n[5] * s);
    else if (k === "E")
      x.ellipse(ox + n[1] * s, oy + n[2] * s, n[3] * s, n[4] * s, 0, n[5], n[6], !!n[7]);
  }
}
function trace(x: CanvasRenderingContext2D, items: Item[]) {
  x.beginPath();
  for (const it of items) for (const sp of it.g.sub) emit(x, sp, it.ox, it.oy, it.s);
}
function endsOf(sp: Sub): number[][] {
  if (sp.closed) return [];
  const a = sp.c[0] as number[];
  const last = sp.c[sp.c.length - 1] as number[];
  const k = sp.c[sp.c.length - 1][0];
  let b: number[] | null = null;
  if (k === "L" || k === "M") b = [last[1], last[2]];
  else if (k === "Q") b = [last[3], last[4]];
  else if (k === "E")
    b = [last[1] + last[3] * Math.cos(last[6]), last[2] + last[4] * Math.sin(last[6])];
  const out = [[a[1], a[2]]];
  if (b) out.push(b);
  return out;
}
function scaleItems(items: Item[], k: number): Item[] {
  return items.map((it) => ({ g: it.g, ox: it.ox * k, oy: it.oy * k, s: it.s * k }));
}
function strokePass(
  x: CanvasRenderingContext2D,
  items: Item[],
  w: number,
  blur: number,
  col: string,
  alpha: number,
  additive = true,
) {
  x.save();
  x.lineCap = "round";
  x.lineJoin = "round";
  if (blur > 0.25) x.filter = `blur(${blur.toFixed(2)}px)`;
  if (additive) x.globalCompositeOperation = "lighter";
  x.globalAlpha = alpha;
  x.lineWidth = w;
  x.strokeStyle = col;
  trace(x, items);
  x.stroke();
  x.restore();
}
function buildSpill(items: Item[], cap: number, W: number, H: number) {
  const c = mk(W * SPILL_S, H * SPILL_S);
  const x = c.getContext("2d")!;
  const it = scaleItems(items, SPILL_S);
  const k = cap * SPILL_S;
  strokePass(x, it, k * 0.62, k * 0.3, "rgba(255,22,118,1)", 0.115);
  strokePass(x, it, k * 0.42, k * 0.11, "rgba(255,40,140,1)", 0.2);
  return c;
}
function buildBloom(items: Item[], tube: number, W: number, H: number) {
  const c = mk(W * BLOOM_S, H * BLOOM_S);
  const x = c.getContext("2d")!;
  const it = scaleItems(items, BLOOM_S);
  const t = tube * BLOOM_S;
  strokePass(x, it, t * 2.6, t * 1.75, "rgba(255,40,146,1)", 0.3);
  strokePass(x, it, t * 1.34, t * 0.58, "rgba(255,100,188,1)", 0.48);
  return c;
}
function paintCore(x: CanvasRenderingContext2D, items: Item[], tube: number) {
  strokePass(x, items, tube * 0.88, tube * 0.1, "#ff2a96", 1);
  strokePass(x, items, tube * 0.54, tube * 0.06, "#ff8ed2", 1);
  strokePass(x, items, tube * 0.24, tube * 0.035, "#fff4fb", 1);
}
function buildSpec(items: Item[], tube: number, W: number, H: number) {
  const c = mk(W, H);
  const x = c.getContext("2d")!;
  x.save();
  x.translate(-tube * 0.02, -tube * 0.25);
  x.lineCap = "round";
  x.lineJoin = "round";
  x.lineWidth = tube * 0.17;
  x.strokeStyle = "rgba(255,240,250,.52)";
  x.filter = `blur(${(tube * 0.11).toFixed(2)}px)`;
  trace(x, items);
  x.stroke();
  x.restore();
  x.globalCompositeOperation = "destination-in";
  x.lineCap = "round";
  x.lineJoin = "round";
  x.lineWidth = tube * 0.66;
  x.strokeStyle = "#fff";
  trace(x, items);
  x.stroke();
  return c;
}
function tips(x: CanvasRenderingContext2D, items: Item[], tube: number) {
  x.save();
  x.globalCompositeOperation = "source-over";
  for (const it of items) {
    for (const sp of it.g.sub) {
      for (const e of endsOf(sp)) {
        const px = it.ox + e[0] * it.s;
        const py = it.oy + e[1] * it.s;
        x.beginPath();
        x.arc(px, py, tube * 0.47, 0, P * 2);
        x.fillStyle = "#33101f";
        x.fill();
        x.beginPath();
        x.arc(px, py, tube * 0.47, 0, P * 2);
        x.lineWidth = 1;
        x.strokeStyle = "rgba(255,150,205,.20)";
        x.stroke();
        x.beginPath();
        x.arc(px - tube * 0.06, py - tube * 0.1, tube * 0.2, 0, P * 2);
        x.fillStyle = "rgba(255,205,235,.14)";
        x.fill();
      }
    }
  }
  x.restore();
}
function electrodes(
  x: CanvasRenderingContext2D,
  list: { x: number; y: number; a: number }[],
  tube: number,
) {
  x.save();
  for (const e of list) {
    const cx = e.x;
    const cy = e.y;
    const sx = cx + Math.cos(e.a) * tube * 1.55;
    const sy = cy + Math.sin(e.a) * tube * 1.55;
    x.beginPath();
    x.moveTo(cx, cy);
    x.lineTo(sx, sy);
    x.lineCap = "round";
    x.lineWidth = tube * 0.46;
    x.strokeStyle = "#120a10";
    x.stroke();
    x.beginPath();
    x.arc(sx, sy, tube * 0.4, 0, P * 2);
    x.fillStyle = "#0b0509";
    x.fill();
    x.beginPath();
    x.arc(cx, cy, tube * 0.8, 0, P * 2);
    x.fillStyle = "#180a12";
    x.fill();
    x.beginPath();
    x.arc(cx, cy, tube * 0.8, 0, P * 2);
    x.lineWidth = 1.4;
    x.strokeStyle = "rgba(214,120,164,.30)";
    x.stroke();
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, tube * 1.25);
    g.addColorStop(0, "rgba(255,226,244,.95)");
    g.addColorStop(0.24, "rgba(255,90,180,.62)");
    g.addColorStop(1, "rgba(255,50,150,0)");
    x.globalCompositeOperation = "lighter";
    x.beginPath();
    x.arc(cx, cy, tube * 1.25, 0, P * 2);
    x.fillStyle = g;
    x.fill();
    x.globalCompositeOperation = "source-over";
  }
  x.restore();
}

/* Electrode feeds for custom lettering: where the first tube starts and the last one ends. */
function genericElectrodes(lines: Glyph[][]) {
  const out: { line: number; i: number; p: number[]; a: number }[] = [];
  lines.forEach((gl, line) => {
    const idx = gl.map((g, i) => (g.sub.length ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) return;
    const first = idx[0];
    const lastI = idx[idx.length - 1];
    const startSub = gl[first].sub.find((s) => !s.closed);
    if (startSub) {
      const p = endsOf(startSub)[0];
      out.push({ line, i: first, p, a: p[1] < 0.5 ? -0.95 : 2.6 });
    }
    const endSub = [...gl[lastI].sub].reverse().find((s) => !s.closed);
    if (endSub && (lastI !== first || idx.length === 1)) {
      const e = endsOf(endSub);
      const p = e[e.length - 1];
      if (lastI !== first) out.push({ line, i: lastI, p, a: p[1] < 0.5 ? -1.45 : 2.45 });
    }
  });
  return out;
}

export function NeonSign({
  className,
  text = DEFAULT_TEXT,
  mode = "dark",
  monochrome = true,
  backgroundColor,
  hue = 0,
  saturation = 1,
  brightness = 1,
}: NeonSignProps) {
  const prefersReducedMotion = useReducedMotion();
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const light = mode === "light";

  useEffect(() => {
    const board = boardRef.current;
    const cv = canvasRef.current;
    if (!board || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = !!prefersReducedMotion;

    const authored = text === DEFAULT_TEXT;
    const LINES = text
      .toUpperCase()
      .split("\n")
      .map((l) => [...l].filter((ch) => GLYPHS[ch]).join(""))
      .filter((l) => l.trim().length);
    const glyphLines = LINES.map((s) => [...s].map((ch) => GLYPHS[ch]));
    const ELECTRODES = authored ? AUTHORED_ELECTRODES : genericElectrodes(glyphLines);
    const lastLine = glyphLines.length - 1;
    const FLICK = authored
      ? AUTHORED_FLICK
      : {
          line: lastLine,
          i: Math.min(3, Math.max(0, (glyphLines[lastLine]?.length ?? 1) - 1)),
        };

    let W = 0;
    let H = 0;
    let cap = 0;
    let tube = 0;
    let BASE: HTMLCanvasElement | null = null;
    let WLIT: HTMLCanvasElement | null = null;
    let dirty = { x: 0, y: 0, w: 0, h: 0 };
    let composed = false;
    let lastF = -1;

    function layout() {
      let maxW = 0;
      const lines = glyphLines.map((gl) => {
        const sum = gl.reduce((a, g) => a + g.w, 0);
        maxW = Math.max(maxW, sum + (gl.length - 1) * MINGAP);
        return { gl, sum };
      });
      const blockW = maxW;
      const blockH = lines.length + (lines.length - 1) * LINEGAP;
      cap = Math.min((W - W * 0.2) / blockW, (H - H * 0.28) / blockH);
      cap = Math.max(10, cap);
      tube = cap * 0.105;
      const x0 = (W - blockW * cap) / 2;
      const y0 = (H - blockH * cap) / 2;

      const items: (Item & { line: number; i: number })[] = [];
      let flick: Item | null = null;
      const elec: { x: number; y: number; a: number }[] = [];
      lines.forEach((L, i) => {
        const n = L.gl.length;
        const gap = n > 1 ? (blockW - L.sum) / (n - 1) : 0;
        let pen = x0;
        const top = y0 + i * (1 + LINEGAP) * cap;
        L.gl.forEach((g, j) => {
          const it = { g, ox: pen, oy: top, s: cap, line: i, i: j };
          items.push(it);
          if (i === FLICK.line && j === FLICK.i && g.sub.length) flick = it;
          for (const E of ELECTRODES) {
            if (E.line === i && E.i === j)
              elec.push({ x: pen + E.p[0] * cap, y: top + E.p[1] * cap, a: E.a });
          }
          pen += g.w * cap + gap; // authored: the gap is added unscaled
        });
      });
      return { items, flick: flick as Item | null, elec };
    }

    function bake() {
      const L = layout();
      const items = L.items;
      const flick = L.flick;
      const steady = items.filter((it) => it !== flick);
      const one = flick ? [flick] : [];

      const base = mk(W, H);
      const b = base.getContext("2d")!;
      b.clearRect(0, 0, W, H);
      b.globalCompositeOperation = "lighter";
      b.drawImage(buildSpill(steady, cap, W, H), 0, 0, W, H);
      b.drawImage(buildBloom(steady, tube, W, H), 0, 0, W, H);
      b.globalCompositeOperation = "source-over";

      const tl = mk(W, H);
      const t = tl.getContext("2d")!;
      strokePass(t, items, tube, 0, "#3d162a", 1, false);
      strokePass(t, items, tube * 0.7, 0, "#280c1a", 1, false);
      paintCore(t, steady, tube);
      t.globalCompositeOperation = "lighter";
      t.drawImage(buildSpec(items, tube, W, H), 0, 0);
      t.globalCompositeOperation = "source-over";
      tips(t, items, tube);
      electrodes(t, L.elec, tube);
      b.drawImage(tl, 0, 0);
      BASE = base;

      const lit = mk(W, H);
      const w = lit.getContext("2d")!;
      if (one.length) {
        w.globalCompositeOperation = "lighter";
        w.drawImage(buildSpill(one, cap, W, H), 0, 0, W, H);
        w.drawImage(buildBloom(one, tube, W, H), 0, 0, W, H);
        w.globalCompositeOperation = "source-over";
        paintCore(w, one, tube);
        w.globalCompositeOperation = "destination-out";
        for (const sp of one[0].g.sub) {
          for (const e of endsOf(sp)) {
            w.beginPath();
            w.arc(one[0].ox + e[0] * one[0].s, one[0].oy + e[1] * one[0].s, tube * 0.47, 0, P * 2);
            w.fill();
          }
        }
        w.globalCompositeOperation = "source-over";
        const pad = cap * 1.35;
        const bx = one[0].ox - pad;
        const by = one[0].oy - pad;
        const bw2 = one[0].g.w * cap + pad * 2;
        const bh2 = cap + pad * 2;
        dirty = { x: Math.max(0, Math.floor(bx)), y: Math.max(0, Math.floor(by)), w: 0, h: 0 };
        dirty.w = Math.min(W - dirty.x, Math.ceil(bw2));
        dirty.h = Math.min(H - dirty.y, Math.ceil(bh2));
      } else {
        dirty = { x: 0, y: 0, w: 0, h: 0 };
      }
      WLIT = lit;
    }

    function compose(f: number) {
      if (!BASE || !ctx) return;
      if (dirty.w > 0 && composed) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.clearRect(dirty.x, dirty.y, dirty.w, dirty.h);
        ctx.drawImage(BASE, dirty.x, dirty.y, dirty.w, dirty.h, dirty.x, dirty.y, dirty.w, dirty.h);
        if (f > 0.002 && WLIT) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = f;
          ctx.drawImage(
            WLIT,
            dirty.x,
            dirty.y,
            dirty.w,
            dirty.h,
            dirty.x,
            dirty.y,
            dirty.w,
            dirty.h,
          );
        }
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(BASE, 0, 0);
        if (f > 0.002 && WLIT) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = f;
          ctx.drawImage(WLIT, 0, 0);
        }
        composed = true;
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      lastF = f;
    }

    /* the flicker: a seeded schedule of dips on one letter, quickened for the preview as in ThreeUI */
    let fseed = 0x1981;
    const frnd = () => {
      fseed = (Math.imul(fseed, 1103515245) + 12345) >>> 0;
      return fseed / 4294967296;
    };
    type Ev = { t0: number; dur: number; segs: { d: number; v: number }[] };
    let ev: Ev | null = null;
    let clock = 0;
    function nextEvent(after: number): Ev {
      const segs: { d: number; v: number }[] = [];
      const n = 1 + (frnd() < 0.42 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        segs.push({ d: 0.2 + frnd() * 0.26, v: 0.22 + frnd() * 0.4 });
        segs.push({ d: 0.24 + frnd() * 0.34, v: 1 });
      }
      const total = segs.reduce((a, s) => a + s.d, 0);
      return { t0: after + 1.25 + frnd() * 1.75, dur: total, segs };
    }
    function level(t: number) {
      if (!ev) ev = nextEvent(0.55);
      while (t > ev.t0 + ev.dur) ev = nextEvent(ev.t0 + ev.dur);
      if (t < ev.t0) return 1;
      let u = t - ev.t0;
      let prev = 1;
      for (const s of ev.segs) {
        if (u < s.d) {
          let p = u / s.d;
          p = p * p * (3 - 2 * p);
          return prev + (s.v - prev) * p;
        }
        u -= s.d;
        prev = s.v;
      }
      return 1;
    }

    function resize() {
      const w = Math.round(board!.clientWidth);
      const h = Math.round(board!.clientHeight);
      if (!w || !h || !glyphLines.length) return;
      if (w === W && h === H) return;
      W = w;
      H = h;
      cv!.width = W;
      cv!.height = H;
      bake();
      composed = false;
      compose(reduce ? 1 : level(clock));
    }

    let raf = 0;
    let last = 0;
    let visible = true;
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      clock += dt;
      const f = level(clock);
      if (Math.abs(f - lastF) > 0.008) compose(f);
    };
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    resize();
    let rt = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(rt);
      if (!W) resize();
      else rt = window.setTimeout(resize, 180);
    });
    ro.observe(board);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(board);
    start();

    return () => {
      stop();
      window.clearTimeout(rt);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [text, prefersReducedMotion]);

  const background = backgroundColor ?? (light ? "#f4f4f2" : "#090909");
  const tone = monochrome
    ? light
      ? "grayscale(1) invert(1) contrast(1.08)"
      : "grayscale(1) contrast(1.08)"
    : light
      ? "invert(1) hue-rotate(180deg)"
      : undefined;
  const safeHue = Math.min(180, Math.max(-180, hue));
  const safeSaturation = Math.min(2, Math.max(0, saturation));
  const safeBrightness = Math.min(1.65, Math.max(0.35, brightness));
  const grade =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        className,
      )}
      style={{ background, filter: grade }}
    >
      <div
        ref={boardRef}
        className="relative aspect-video max-h-[calc(100%-32px)] w-[min(calc(100%-32px),1040px)]"
      >
        <motion.canvas
          ref={canvasRef}
          aria-hidden="true"
          className="block h-full w-full"
          style={{ transformOrigin: "50% 52%", filter: tone, willChange: "transform, opacity" }}
          initial={false}
          animate={
            prefersReducedMotion
              ? { y: 0, scale: 1, opacity: 1 }
              : {
                  y: [3, -3, 0, 3],
                  scale: [0.988, 1, 0.996, 0.988],
                  opacity: [0.88, 1, 0.96, 0.88],
                }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  duration: 5.6,
                  times: [0, 0.45, 0.68, 1],
                  ease: [0.22, 1, 0.36, 1],
                  repeat: Infinity,
                }
          }
        />
        <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      </div>
    </div>
  );
}
