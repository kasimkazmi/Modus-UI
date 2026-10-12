"use client";
// Ported from ThreeUI Community's Outline Typeflow (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OutlineTypeflowProps {
  mode?: "dark" | "light";
  scale?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  path?: string;
  text?: string;
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

/* the default mark (24x24 viewBox): a ring */
const DEFAULT_PATH = "M12 2a10 10 0 1 1 0 20a10 10 0 1 1 0-20Zm0 5a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z";

const SVGNS = "http://www.w3.org/2000/svg";

interface PathLine {
  pts: { x: number; y: number }[];
  acc: number[];
  len: number;
}

/* dense samples of a path, split wherever the pen jumps between subpaths */
function polylines(d: string, step: number): PathLine[] {
  const scratch = document.createElementNS(SVGNS, "svg");
  scratch.setAttribute("viewBox", "0 0 24 24");
  scratch.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  document.body.appendChild(scratch);
  const el = document.createElementNS(SVGNS, "path");
  el.setAttribute("d", d);
  scratch.appendChild(el);
  const L = el.getTotalLength();
  const n = Math.max(64, Math.ceil(L / step));
  const lines: { x: number; y: number }[][] = [];
  let cur: { x: number; y: number }[] = [];
  let prev: DOMPoint | null = null;
  for (let i = 0; i <= n; i++) {
    const p = el.getPointAtLength((L * i) / n);
    if (prev) {
      const jump = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (jump > step * 6) {
        if (cur.length > 3) lines.push(cur);
        cur = [];
      }
    }
    cur.push({ x: p.x, y: p.y });
    prev = p;
  }
  if (cur.length > 3) lines.push(cur);
  document.body.removeChild(scratch);

  /* arc-length parameterise each run */
  return lines
    .map((pts) => {
      const acc = [0];
      for (let i = 1; i < pts.length; i++)
        acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      return { pts, acc, len: acc[acc.length - 1] };
    })
    .filter((l) => l.len > step * 8);
}

const _pt = { x: 0, y: 0, a: 0 };
function atLength(line: PathLine, t: number) {
  const len = line.len;
  t = t - Math.floor(t / len) * len; // wrap
  const a = line.acc;
  let lo = 0;
  let hi = a.length - 1;
  while (lo < hi - 1) {
    const m = (lo + hi) >> 1;
    if (a[m] <= t) lo = m;
    else hi = m;
  }
  const seg = a[hi] - a[lo] || 1;
  const f = (t - a[lo]) / seg;
  const p0 = line.pts[lo];
  const p1 = line.pts[hi];
  _pt.x = p0.x + (p1.x - p0.x) * f;
  _pt.y = p0.y + (p1.y - p0.y) * f;
  _pt.a = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  return _pt;
}

function createTypeflow(
  { cv, ctx, s, ink, local, signal }: StudyEnv,
  path: string,
  PHRASE: string,
) {
  const lines = polylines(path, 0.05);
  let flow = 0;
  let speed = 1;
  let hover = false;
  let look: { x: number; y: number } | null = null;
  const burst: { t: number }[] = []; // letters kicked loose by a click

  const opts = { signal };
  cv.addEventListener("pointerenter", () => (hover = true), opts);
  cv.addEventListener(
    "pointerleave",
    () => {
      hover = false;
      look = null;
    },
    opts,
  );
  cv.addEventListener("pointermove", (e) => (look = local(e)), opts);
  cv.addEventListener(
    "pointerdown",
    () => {
      burst.push({ t: performance.now() });
      if (burst.length > 3) burst.shift();
    },
    opts,
  );

  function draw(now: number, dt: number) {
    ctx.clearRect(0, 0, s.w, s.h);

    speed += ((hover ? 3.1 : 1) - speed) * Math.min(1, dt / 280);
    flow += ((speed * dt) / 1000) * 1.9;

    const span = s.u * 0.62; // the 24-unit mark, in card px
    const k = span / 24;
    const cx = s.w / 2 - 12 * k;
    const cy = s.h / 2 + s.u * 0.02 - 12 * k;
    const fs = s.u * 0.025;
    const step = (fs * 0.76) / k; // spacing measured in path units

    /* the most recent click sends a shove outward that settles back */
    let kick = 0;
    if (burst.length) {
      const kickAge = (now - burst[burst.length - 1].t) / 1000;
      kick = Math.max(0, 1 - kickAge / 1.1);
      kick = kick * kick;
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold " + fs.toFixed(2) + "px " + FACE;
    const base = 0.92 - kick * 0.35;
    ctx.fillStyle = ink(base);
    let lit = -1; /* quantised, so fillStyle is touched rarely */
    const lx = look ? look.x : -1e9;
    const ly = look ? look.y : -1e9;
    const LR = s.u * 0.22;
    const LR2 = LR * LR;

    let idx = 0;
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      const n = Math.max(3, Math.round(line.len / step));
      const sp = line.len / n;
      for (let i = 0; i < n; i++) {
        const q = atLength(line, i * sp + flow);
        let px = cx + q.x * k;
        let py = cy + q.y * k;

        if (kick > 0) {
          const dx = px - (cx + 12 * k);
          const dy = py - (cy + 12 * k);
          const d = Math.hypot(dx, dy) || 1;
          const wob = Math.sin(i * 1.7 + li * 2.3);
          px += (dx / d) * kick * s.u * 0.11 * (0.6 + 0.5 * wob);
          py += (dy / d) * kick * s.u * 0.11 * (0.6 + 0.5 * wob);
        }

        let gd = 0;
        if (look) {
          const ddx = px - lx;
          const ddy = py - ly;
          const dd = ddx * ddx + ddy * ddy;
          if (dd < LR2) gd = 1 - Math.sqrt(dd) / LR;
        }
        const lv = (gd * 5) | 0;
        if (lv !== lit) {
          lit = lv;
          ctx.fillStyle = ink(base + (1 - base) * ((lv + (lv ? 0.5 : 0)) / 5));
        }
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(qang(q.a));
        ctx.fillText(PHRASE.charAt(idx++ % PHRASE.length), 0, 0);
        ctx.restore();
      }
    }
  }
  return { draw, reset: undefined as undefined | (() => void) };
}

export function OutlineTypeflow({
  mode = "dark",
  scale = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  path = DEFAULT_PATH,
  text = "modusreadsthepathandwritesitbackagain",
  inkColor,
  backgroundColor,
  className,
}: OutlineTypeflowProps) {
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
    const study = createTypeflow(
      {
        cv,
        ctx,
        s,
        ink,
        local,
        signal: ac.signal,
      },
      path,
      text,
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
  }, [INK, prefersReducedMotion, path, text]);

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
            aria-label="Outline Typeflow: hover to speed the type, click to shove it outward"
            className="absolute inset-0 block h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
