"use client";
// Ported from ThreeUI Community's Ball Study (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BallStudyProps {
  mode?: "dark" | "light";
  scale?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  inkColor?: string;
  backgroundColor?: string;
  className?: string;
}

const MONO = '"Courier New", Courier, monospace';
const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=?#§¶△◊×÷%@&*/<>+-$¥£ΑΒΓΔΕΖΗΘΛΞΠΣΦΨΩαβγδεζηθλμξπστυφχψω«»‹›";
const N = 1900;
const TILT = 0.17;
const ct = Math.cos(TILT);
const st = Math.sin(TILT);
// radius / glyph size / drop, as fractions of the card
const RR = 0.3065;
const FS = 0.0265;
const CYOFF = 0.046;

interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  c: string;
  t: number;
  life: number;
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

export function BallStudy({
  mode = "dark",
  scale = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  inkColor,
  backgroundColor,
  className,
}: BallStudyProps) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const light = mode === "light";
  const surface = backgroundColor ?? (light ? "#f3f5f8" : "#08090a");
  const INK = inkColor ? hexToRgb(inkColor) : light ? "20,19,16" : "238,240,244";

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const ac = new AbortController();
    const s = { w: 0, h: 0, dpr: 1 };

    const resize = () => {
      const r = { width: cv.clientWidth, height: cv.clientHeight };
      if (!r.width || !r.height) return false;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(r.width * dpr);
      const h = Math.round(r.height * dpr);
      if (w === cv.width && h === cv.height && s.w === r.width) return false;
      cv.width = w;
      cv.height = h;
      s.w = r.width;
      s.h = r.height;
      s.dpr = dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };

    const pts: { x: number; y: number; z: number; c: string; back: number }[] = [];
    const r0 = rng(77712345);
    for (let i = 0; i < N; i++) {
      // uniform random on the sphere — a lattice would show its spiral arms
      const y = 1 - 2 * r0();
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const th = r0() * Math.PI * 2;
      pts.push({
        x: Math.cos(th) * rad,
        y,
        z: Math.sin(th) * rad,
        c: CHARS.charAt(Math.floor(r0() * CHARS.length)),
        back: 0, // timestamp at which it regrows
      });
    }

    let spin = 0;
    let vel = 0.17;
    let hover = false;
    const parts: Part[] = [];
    const proj = new Float32Array(N * 4); // x, y, scale, depth

    const draw = (now: number, dt: number) => {
      ctx.clearRect(0, 0, s.w, s.h);

      const target = hover ? 0.62 : 0.17;
      vel += (target - vel) * Math.min(1, dt / 300);
      spin += (vel * dt) / 1000;

      const size = Math.min(s.w, s.h);
      const cx = s.w / 2;
      const cy = s.h / 2 + size * CYOFF;
      const R = size * RR;
      const fs = size * FS;
      const cs = Math.cos(spin);
      const sn = Math.sin(spin);

      const order: number[] = [];
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        const x1 = p.x * cs - p.z * sn;
        const z1 = p.x * sn + p.z * cs;
        const y2 = p.y * ct - z1 * st;
        const z2 = p.y * st + z1 * ct;
        const d = (z2 + 1) * 0.5; // 0 = far side, 1 = nearest point
        const sc = 0.1 + 0.9 * Math.pow(d, 1.8);
        proj[i * 4] = cx + x1 * R;
        proj[i * 4 + 1] = cy + y2 * R;
        proj[i * 4 + 2] = sc;
        proj[i * 4 + 3] = d;
        if (p.back > now) continue;
        order.push(i);
      }
      order.sort((a, b) => proj[a * 4 + 3] - proj[b * 4 + 3]);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let lastFont = "";
      for (let k = 0; k < order.length; k++) {
        const j = order[k];
        const z2b = proj[j * 4 + 3];
        const scb = proj[j * 4 + 2];
        let a = 0.55 + 0.45 * Math.pow(z2b, 1.1);
        const grow = pts[j].back ? Math.min(1, (now - pts[j].back) / 420) : 1;
        if (grow < 1) a *= grow;
        // depth-sorted, so quantising the size keeps ctx.font churn low
        const f = "bold " + Math.round(fs * scb * 4) / 4 + "px " + MONO;
        if (f !== lastFont) {
          ctx.font = f;
          lastFont = f;
        }
        ctx.fillStyle = "rgba(" + INK + "," + a.toFixed(3) + ")";
        ctx.fillText(pts[j].c, proj[j * 4], proj[j * 4 + 1]);
      }

      // knocked-loose letters
      const g = size * 0.8;
      for (let m = parts.length - 1; m >= 0; m--) {
        const q = parts[m];
        const age = now - q.t;
        if (age > q.life || q.y > s.h + 40) {
          parts.splice(m, 1);
          continue;
        }
        q.vy += (g * dt) / 1000;
        q.x += (q.vx * dt) / 1000;
        q.y += (q.vy * dt) / 1000;
        q.rot += (q.vr * dt) / 1000;
        const af = Math.max(0, 1 - age / q.life);
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.rot);
        ctx.font = "bold " + q.size.toFixed(2) + "px " + MONO;
        ctx.fillStyle = "rgba(" + INK + "," + (0.95 * Math.pow(af, 0.5)).toFixed(3) + ")";
        ctx.fillText(q.c, 0, 0);
        ctx.restore();
      }
    };

    let raf = 0;
    let onScreen = true;
    let prev = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(64, now - prev);
      prev = now;
      draw(now, dt);
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

    const opts = { signal: ac.signal };
    cv.addEventListener("pointerenter", () => (hover = true), opts);
    cv.addEventListener("pointerleave", () => (hover = false), opts);
    cv.addEventListener(
      "pointerdown",
      (e) => {
        const r = cv.getBoundingClientRect();
        const kk = cv.clientWidth / (r.width || 1);
        const p = { x: (e.clientX - r.left) * kk, y: (e.clientY - r.top) * kk };
        const size = Math.min(s.w, s.h);
        const fs = size * FS;
        const now = performance.now();
        const hitR = size * 0.055;
        const hit = hitR * hitR;
        for (let i = 0; i < N; i++) {
          if (pts[i].back > now) continue;
          if (proj[i * 4 + 3] < 0.72) continue; // only the letters actually facing you
          const dx = proj[i * 4] - p.x;
          const dy = proj[i * 4 + 1] - p.y;
          if (dx * dx + dy * dy > hit) continue;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          pts[i].back = now + 1500 + Math.random() * 260;
          parts.push({
            x: proj[i * 4],
            y: proj[i * 4 + 1],
            vx:
              (dx / d) * size * (0.1 + Math.random() * 0.16) + (Math.random() - 0.5) * size * 0.05,
            vy: (dy / d) * size * 0.08 - size * (0.04 + Math.random() * 0.1),
            rot: 0,
            vr: (Math.random() - 0.5) * 5.5,
            size: fs * (0.85 + 0.15 * proj[i * 4 + 2]), // reads as a whole letter once it is off the ball
            c: pts[i].c,
            t: now,
            life: 2100,
          });
        }
        if (parts.length > 420) parts.splice(0, parts.length - 420);
      },
      opts,
    );

    const onResize = () => {
      if (resize()) parts.length = 0;
      draw(performance.now(), 16);
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
  }, [INK, prefersReducedMotion]);

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
      <canvas
        ref={canvasRef}
        aria-label="Ball: hover to spin faster, click to knock letters loose"
        className="absolute inset-0 block h-full w-full cursor-crosshair touch-none"
        style={{
          transform: boundedScale === 1 ? undefined : `scale(${boundedScale})`,
        }}
      />
    </div>
  );
}
