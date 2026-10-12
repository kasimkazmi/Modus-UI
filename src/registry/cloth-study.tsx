"use client";
// Ported from ThreeUI Community's Cloth Study (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ClothStudyProps {
  mode?: "dark" | "light";
  scale?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
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

const GX = 19;
const GY = 21;

interface ClothPoint {
  x: number;
  y: number;
  px: number;
  py: number;
  pin: { x: number; y: number } | null;
  free: number;
  gx?: number;
  gy?: number;
}

function createCloth({ cv, ctx, s, ink, local, signal }: StudyEnv, PHRASE: string) {
  let pts: ClothPoint[] = [];
  let rest = 0;
  let built = 0;
  let pointer: { x: number; y: number } | null = null;
  let wind = 0;
  let held: ClothPoint | null = null;

  function build() {
    const w = s.w;
    if (!w) return;
    rest = (s.u * 0.58) / (GX - 1);
    const x0 = w / 2 - (rest * (GX - 1)) / 2;
    const y0 = s.h * 0.185;
    pts = [];
    for (let j = 0; j < GY; j++)
      for (let i = 0; i < GX; i++) {
        const x = x0 + i * rest;
        const y = y0 + j * rest;
        pts.push({
          x,
          y,
          px: x,
          py: y,
          pin: j === 0 && (i % 5 === 0 || i === GX - 1) ? { x, y } : null,
          free: 0,
        });
      }
    built = w;
  }
  const P = (i: number, j: number) => pts[j * GX + i];

  const opts = { signal };
  cv.addEventListener(
    "pointermove",
    (e) => {
      pointer = local(e);
      if (held) {
        held.gx = pointer.x;
        held.gy = pointer.y;
      }
    },
    opts,
  );
  cv.addEventListener("pointerleave", () => (pointer = null), opts);
  cv.addEventListener(
    "pointerdown",
    (e) => {
      const p = local(e);
      let best: ClothPoint | null = null;
      let bd = 1e9;
      for (let k = 0; k < pts.length; k++) {
        const q = pts[k];
        if (q.pin) continue;
        const d = (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y);
        if (d < bd) {
          bd = d;
          best = q;
        }
      }
      if (best && bd < s.u * 0.24 * (s.u * 0.24)) {
        held = best;
        held.gx = p.x;
        held.gy = p.y;
        cv.setPointerCapture(e.pointerId);
      }
    },
    opts,
  );
  const drop = () => (held = null);
  cv.addEventListener("pointerup", drop, opts);
  cv.addEventListener("pointercancel", drop, opts);

  /* fixed-step verlet: a variable dt makes the constraint pass under-relax and the
     sheet collapses instead of hanging */
  let acc2 = 0;
  const H = 1 / 120;
  function step(dtms: number) {
    acc2 += Math.min(50, dtms) / 1000;
    let guard = 0;
    while (acc2 >= H && guard++ < 2) {
      acc2 -= H;
      substep(H);
    }
  }
  function substep(h: number) {
    const g = s.w * 1.6;
    const now = performance.now();
    wind += h;
    const hh = h * h;
    const damp = 0.992;
    for (let k = 0; k < pts.length; k++) {
      const p = pts[k];
      if (held && p === held) {
        p.px = p.x;
        p.py = p.y;
        p.x += (held.gx! - p.x) * 0.45; // the hand leads, the cloth follows
        p.y += (held.gy! - p.y) * 0.45;
        continue;
      }
      if (p.pin && p.free < now) {
        p.x = p.pin.x;
        p.y = p.pin.y;
        p.px = p.x;
        p.py = p.y;
        continue;
      }
      const vx = (p.x - p.px) * damp;
      const vy = (p.y - p.py) * damp;
      p.px = p.x;
      p.py = p.y;
      const breeze =
        (Math.sin(wind * 1.9 + p.y * 0.035) * 0.55 + Math.sin(wind * 0.7) * 0.45) * s.u * 0.55;
      p.x += vx + breeze * hh;
      p.y += vy + g * hh;
      if (pointer && !held) {
        // a passing hand only brushes it
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d = Math.hypot(dx, dy);
        const rr = s.u * 0.13;
        if (d < rr && d > 0.001) {
          const push = (1 - d / rr) * (1 - d / rr) * s.u * 0.008;
          p.x += (dx / d) * push;
          p.y += (dy / d) * push;
        }
      }
    }
    const iters = held ? 12 : 6; // a hand on it needs the constraint to travel
    for (let it = 0; it < iters; it++) {
      for (let j = 0; j < GY; j++)
        for (let i = 0; i < GX; i++) {
          if (i < GX - 1) solve(P(i, j), P(i + 1, j), rest);
          if (j < GY - 1) solve(P(i, j), P(i, j + 1), rest);
        }
      for (let m = 0; m < pts.length; m++) {
        const q = pts[m];
        if (held && q === held) {
          q.x = held.gx!;
          q.y = held.gy!;
          continue;
        }
        if (q.pin && q.free < now) {
          q.x = q.pin.x;
          q.y = q.pin.y;
        }
      }
    }
    /* a final hard clamp: cloth stretches a little and then simply refuses,
       otherwise a long pull draws it out into strings */
    const lim = rest * 1.14;
    for (let j2 = 0; j2 < GY; j2++)
      for (let i2 = 0; i2 < GX; i2++) {
        if (i2 < GX - 1) clampLink(P(i2, j2), P(i2 + 1, j2), lim);
        if (j2 < GY - 1) clampLink(P(i2, j2), P(i2, j2 + 1), lim);
      }
  }
  function clampLink(a: ClothPoint, b: ClothPoint, lim: number) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    if (d <= lim || d < 1e-4) return;
    const f = ((d - lim) / d) * 0.5;
    const ox = dx * f;
    const oy = dy * f;
    if (a !== held && !(a.pin && a.free < performance.now())) {
      a.x += ox;
      a.y += oy;
    }
    if (b !== held && !(b.pin && b.free < performance.now())) {
      b.x -= ox;
      b.y -= oy;
    }
  }
  function solve(a: ClothPoint, b: ClothPoint, len: number) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1e-4;
    const diff = ((d - len) / d) * 0.5;
    const ox = dx * diff;
    const oy = dy * diff;
    a.x += ox;
    a.y += oy;
    b.x -= ox;
    b.y -= oy;
  }

  function draw(now: number, dt: number) {
    if (built !== s.w) build();
    ctx.clearRect(0, 0, s.w, s.h);
    step(dt);

    const fs = rest * 0.86;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold " + fs.toFixed(2) + "px " + FACE;
    let idx = 0;
    for (let j = 0; j < GY - 1; j++) {
      for (let i = 0; i < GX - 1; i++) {
        const a = P(i, j);
        const b = P(i + 1, j);
        const c = P(i, j + 1);
        const d2 = P(i + 1, j + 1);
        const mx = (a.x + b.x + c.x + d2.x) / 4;
        const my = (a.y + b.y + c.y + d2.y) / 4;
        const ex = (b.x - a.x + d2.x - c.x) / 2;
        const ey = (b.y - a.y + d2.y - c.y) / 2;
        const fx = (c.x - a.x + d2.x - b.x) / 2;
        const fy = (c.y - a.y + d2.y - b.y) / 2;
        const sx = Math.hypot(ex, ey) / rest;
        const sy = Math.hypot(fx, fy) / rest;
        const area = Math.abs(ex * fy - ey * fx) / (rest * rest); // stands in for facing
        const ang = Math.atan2(ey, ex);
        const a2 = 0.2 + 0.75 * Math.min(1, area);
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(qang(ang));
        ctx.scale(Math.max(0.15, Math.min(1.7, sx)), Math.max(0.15, Math.min(1.7, sy)));
        ctx.fillStyle = ink(a2);
        ctx.fillText(PHRASE.charAt(idx++ % PHRASE.length), 0, 0);
        ctx.restore();
      }
    }

    /* the pegs it hangs from */
    for (let i2 = 0; i2 < GX; i2++) {
      const q = P(i2, 0);
      if (!q.pin) continue;
      const pinned = q.free < now;
      ctx.beginPath();
      ctx.arc(q.pin.x, q.pin.y, s.w * (pinned ? 0.006 : 0.004), 0, Math.PI * 2);
      ctx.fillStyle = ink(pinned ? 0.62 : 0.22);
      ctx.fill();
    }
  }
  return { draw, reset: build };
}

export function ClothStudy({
  mode = "dark",
  scale = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  text = "thefabricremembersthelineitwasgivenandkeepsonsayingitwhilethewindpullsatthecorners",
  inkColor,
  backgroundColor,
  className,
}: ClothStudyProps) {
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
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
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
    const study = createCloth(
      {
        cv,
        ctx,
        s,
        ink,
        local,
        signal: ac.signal,
      },
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
  }, [INK, prefersReducedMotion, text]);

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
            aria-label="Cloth: grab the sheet of letters and pull"
            className="absolute inset-0 block h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
