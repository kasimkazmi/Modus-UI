"use client";
// Ported from ThreeUI Community's Morphing Glyph Cloud (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MorphingGlyphCloudProps {
  mode?: "dark" | "light";
  scale?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  fromPath?: string;
  toPath?: string;
  inkColor?: string;
  backgroundColor?: string;
  className?: string;
}

const FACE = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
/* on black the eye needs far less ink, so every alpha runs through SOFT first */
const SOFT = 0.88;
/* Snapping every angle to one of 64 steps keeps the glyph raster cache warm. */
const QA = (Math.PI * 2) / 64;
function qang(a: number) {
  return Math.round(a / QA) * QA;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

interface Surface {
  w: number;
  h: number;
  dpr: number;
  /* panels are not square, so scale off the short side */
  u: number;
}

interface StudyEnv {
  cv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  s: Surface;
  ink: (a: number) => string;
  local: (e: PointerEvent) => { x: number; y: number };
  signal: AbortSignal;
}

/* the two default marks (24x24 viewBox) */
const DEFAULT_FROM_PATH =
  "M12 0C12.9 7 17 11.1 24 12C17 12.9 12.9 17 12 24C11.1 17 7 12.9 0 12C7 11.1 11.1 7 12 0Z";
const DEFAULT_TO_PATH =
  "M12 2a10 10 0 1 1 0 20a10 10 0 1 1 0-20Zm0 5a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

/* points scattered evenly inside a filled path, centred and normalised to its own
   bounding box so a short wide mark and a tall one both fill the same frame */
function fitPoints(d: string, spacing: number, rand: () => number, rule: CanvasFillRule) {
  const S = 320;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d", { willReadFrequently: true });
  const out: { x: number; y: number }[] = [];
  if (!x) return out;
  x.setTransform(S / 24, 0, 0, S / 24, 0, 0);
  x.fillStyle = "#000";
  x.fill(new Path2D(d), rule || "evenodd");
  const data = x.getImageData(0, 0, S, S).data;
  const inside: number[] = [];
  for (let i = 0; i < S * S; i++) if (data[i * 4 + 3] > 128) inside.push(i);
  if (!inside.length) return out;
  const hit = new Uint8Array(S * S);
  let x0 = 1e9;
  let x1 = -1e9;
  let y0 = 1e9;
  let y1 = -1e9;
  for (let m = 0; m < inside.length; m++) {
    const gx = inside[m] % S;
    const gy = (inside[m] / S) | 0;
    hit[inside[m]] = 1;
    if (gx < x0) x0 = gx;
    if (gx > x1) x1 = gx;
    if (gy < y0) y0 = gy;
    if (gy > y1) y1 = gy;
  }
  const span = Math.max(x1 - x0, y1 - y0) || 1;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;

  /* jittered grid at the glyph's own advance, so letters sit shoulder to shoulder
     without stacking into an unreadable smear */
  const cell = Math.max(1.6, spacing * span);
  for (let gy2 = y0; gy2 < y1; gy2 += cell) {
    for (let gx2 = x0; gx2 < x1; gx2 += cell) {
      const jx = gx2 + rand() * cell;
      const jy = gy2 + rand() * cell;
      const ix = jx | 0;
      const iy = jy | 0;
      if (ix < 0 || ix >= S || iy < 0 || iy >= S || !hit[iy * S + ix]) continue;
      out.push({ x: (jx - mx) / span, y: (jy - my) / span });
    }
  }
  return out;
}

const SPAN = 0.6; // fractions of the card
const FS = 0.018;
const GAP = (FS * 0.6 * 1.06) / SPAN; // one glyph advance, in shape units
const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<>/\\{}[]()=+-*#$%&@?!";

function createMark(
  { cv, ctx, s, ink, local, signal }: StudyEnv,
  fromPath: string,
  toPath: string,
) {
  const rand = rng(9152026);
  const A = fitPoints(fromPath, GAP, rand, "evenodd"); // the resting mark
  const B = fitPoints(toPath, GAP, rand, "evenodd");
  const glyphs: { c: string; ph: number; sp: number; wob: number }[] = [];
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    glyphs.push({
      c: CHARS.charAt((rand() * CHARS.length) | 0),
      ph: rand() * Math.PI * 2,
      sp: 0.55 + rand() * 0.9,
      wob: 0.4 + rand() * 0.8,
    });
  }
  /* keep the two clouds paired by angle so the morph reads as a rotation, not a shuffle */
  function order(set: { x: number; y: number }[]) {
    return set
      .map((p, i) => ({ i, a: Math.atan2(p.y, p.x), r: Math.hypot(p.x, p.y) }))
      .sort((u, v) => u.a - v.a || u.r - v.r)
      .map((o) => o.i);
  }
  const oa = order(A);
  const ob = order(B);
  const M = Math.min(A.length, B.length);
  const pair: [{ x: number; y: number }, { x: number; y: number }][] = [];
  for (let j = 0; j < M; j++)
    pair.push([A[oa[((j * A.length) / M) | 0]], B[ob[((j * B.length) / M) | 0]]]);

  let m = 0;
  let target = 0;
  let hover: { x: number; y: number } | null = null;
  let live = true;

  const opts = { signal };
  cv.addEventListener(
    "pointerdown",
    () => {
      target = 1 - target;
      live = true;
    },
    opts,
  );
  cv.addEventListener(
    "pointermove",
    (e) => {
      hover = local(e);
      live = true;
    },
    opts,
  );
  cv.addEventListener(
    "pointerleave",
    () => {
      hover = null;
      live = true;
    },
    opts,
  );

  function draw(now: number, dt: number) {
    const moving = hover || Math.abs(target - m) > 1e-4;
    if (!moving && !live) return; // settled: the last frame stays on screen
    live = !!moving;
    ctx.clearRect(0, 0, s.w, s.h);

    m += (target - m) * Math.min(1, dt / 460);
    const e = m < 0.5 ? 4 * m * m * m : 1 - Math.pow(-2 * m + 2, 3) / 2; // easeInOutCubic

    const span = s.u * SPAN;
    const cx = s.w / 2;
    const cy = s.h / 2 + s.u * 0.02;
    const fs = s.u * FS;
    const t = now / 1000;
    const travel = 4 * e * (1 - e); // biggest scatter mid-flight

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold " + fs.toFixed(2) + "px " + FACE;
    ctx.fillStyle = ink(0.88);
    let dirty = false;

    for (let i = 0; i < pair.length; i++) {
      const g = glyphs[i];
      const p = pair[i];
      const ux = p[0].x + (p[1].x - p[0].x) * e;
      const uy = p[0].y + (p[1].y - p[0].y) * e;
      let px = cx + ux * span;
      let py = cy + uy * span;

      /* a slow breath at rest, an arc while morphing */
      px += Math.sin(t * g.sp + g.ph) * s.u * 0.0035 * g.wob;
      py += Math.cos(t * g.sp * 0.9 + g.ph) * s.u * 0.0035 * g.wob;
      py -= travel * Math.sin(g.ph) * s.u * 0.05;

      let a = 0.88;
      if (hover) {
        const dx = px - hover.x;
        const dy = py - hover.y;
        const d2 = dx * dx + dy * dy;
        const rr = s.u * 0.1;
        if (d2 < rr * rr) {
          const d = Math.sqrt(d2) || 1;
          const push = 1 - d / rr;
          px += (dx / d) * push * push * s.u * 0.055;
          py += (dy / d) * push * push * s.u * 0.055;
          a = 0.88 - 0.35 * push;
        }
      }
      if (a !== 0.88) {
        ctx.fillStyle = ink(a);
        dirty = true;
      } else if (dirty) {
        ctx.fillStyle = ink(0.88);
        dirty = false;
      }
      ctx.fillText(g.c, px, py);
    }
  }
  return {
    draw,
    reset: () => {
      live = true;
    },
  };
}

export function MorphingGlyphCloud({
  mode = "dark",
  scale = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  fromPath = DEFAULT_FROM_PATH,
  toPath = DEFAULT_TO_PATH,
  inkColor,
  backgroundColor,
  className,
}: MorphingGlyphCloudProps) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const light = mode === "light";
  const surface = backgroundColor ?? (light ? "#f3f5f8" : "#08090a");
  const INK = inkColor ? hexToRgb(inkColor) : light ? "38,40,48" : "226,228,233";

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const ac = new AbortController();
    const s: Surface = { w: 0, h: 0, dpr: 1, u: 0 };

    const resize = () => {
      const width = cv.clientWidth;
      const height = cv.clientHeight;
      if (!width || !height) return false;
      const dpr = 2;
      const w = Math.round(width * dpr);
      const h = Math.round(height * dpr);
      if (w === cv.width && h === cv.height && s.w === width) return false;
      cv.width = w;
      cv.height = h;
      s.w = width;
      s.h = height;
      s.u = Math.min(width, height);
      s.dpr = dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };

    const INK64: string[] = [];
    for (let q0 = 0; q0 < 64; q0++)
      INK64.push("rgba(" + INK + "," + ((q0 / 63) * SOFT).toFixed(4) + ")");
    const ink = (a: number) => INK64[a <= 0 ? 0 : a >= 1 ? 63 : (a * 63) | 0];
    const local = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const k = cv.clientWidth / (r.width || 1);
      return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
    };

    resize();
    const study = createMark(
      {
        cv,
        ctx,
        s,
        ink,
        local,
        signal: ac.signal,
      },
      fromPath,
      toPath,
    );

    const paint = (now: number, dt: number) => {
      if (!s.w) return;
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      study.draw(now, dt);
    };

    let raf = 0;
    let onScreen = true;
    let prev = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(64, now - prev);
      prev = now;
      paint(now, dt);
      raf = requestAnimationFrame(frame);
    };
    const update = () => {
      const run = onScreen && !document.hidden && !prefersReducedMotion;
      if (run && !raf) {
        prev = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onResize = () => {
      resize();
      study.reset?.();
      paint(performance.now(), 16);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      update();
    });
    io.observe(cv);
    document.addEventListener("visibilitychange", update, {
      signal: ac.signal,
    });
    onResize();
    update();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      ac.abort();
    };
  }, [INK, prefersReducedMotion, fromPath, toPath]);

  const boundedHue = clamp(hue, -180, 180);
  const boundedSaturation = clamp(saturation, 0, 2);
  const boundedBrightness = clamp(brightness, 0.4, 1.8);
  const boundedScale = clamp(scale, 0.65, 1.5);
  const filter =
    boundedHue === 0 && boundedSaturation === 1 && boundedBrightness === 1
      ? undefined
      : `hue-rotate(${boundedHue}deg) saturate(${boundedSaturation}) brightness(${boundedBrightness})`;

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        background: surface,
        opacity: clamp(opacity, 0.1, 1),
        filter,
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center [container-type:size]"
        style={{
          transform: boundedScale === 1 ? undefined : `scale(${boundedScale})`,
        }}
      >
        <div
          className="relative h-[min(100cqw,100cqh)] w-[min(100cqw,100cqh)] cursor-crosshair touch-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 58% at 50% 48%, rgba(255,255,255,.038), rgba(255,255,255,0) 70%)",
          }}
        >
          <canvas
            ref={canvasRef}
            aria-label="Morphing Glyph Cloud: click to morph between the two marks"
            className="absolute inset-0 block h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
