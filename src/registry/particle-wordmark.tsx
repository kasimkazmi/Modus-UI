"use client";
// Ported from ThreeUI Community's Particle Wordmark (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ParticleWordmarkProps {
  /** Text the particle field spells out. */
  text?: string;
  /** Particle palette as RGB triplets, blended across particles. */
  colors?: [number, number, number][];
  /** Scene background. */
  backgroundColor?: string;
  /** Animation speed multiplier. */
  speed?: number;
  className?: string;
}

const DEFAULT_COLORS: [number, number, number][] = [
  [255, 255, 255],
  [226, 232, 240],
  [191, 205, 225],
];
const FORMATS = ["dot", "dot", "square"];
const SIZE_SMALL = [1.4, 2.8];
const SIZE_BIG = [3, 4.2];
const BIG_CHANCE = 0.07;
const GAP = 6;
const SEED = 1337;
const GAMMA = 0.8;
const DUR = 8;
const TAU = Math.PI * 2;

type Particle = {
  cx: number;
  cy: number;
  nx: number;
  ny: number;
  format: string;
  size: number;
  offset: number;
  mask: number;
};

function noise(x: number, y: number, t: number) {
  const a = x + 0.7 * Math.sin(1.2 * y + t);
  const r = y + 0.7 * Math.cos(1.1 * x - t);
  return (
    (Math.sin(1.3 * a + 0.6 * t) +
      Math.cos(1.5 * r - 0.5 * t) +
      Math.sin((a + r) * 0.9 + 0.3 * t)) /
    3
  );
}

function snowfall(
  p: Particle,
  t: number,
  n: {
    fall: number;
    freq: number;
    trail: number;
    sway?: number;
    wind?: number;
    swirl?: number;
    axis?: string;
  },
) {
  const swirl = n.swirl ? n.swirl * noise(3 * p.nx, 3 * p.ny, 0.5 * t) : 0;
  const sway = (n.sway || 0) * Math.sin(0.8 * t + p.offset * TAU + 4 * p.ny) + swirl;
  const i = n.axis === "x" ? p.nx : p.ny;
  const l = n.axis === "x" ? p.ny : p.nx;
  const o = i * n.freq - t * n.fall + p.offset * n.freq + sway + (n.wind || 0) * l;
  const s = o - Math.floor(o);
  return s < n.trail ? 1 - s / n.trail : 0;
}

function squall(p: Particle, t: number) {
  const band = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(3 * p.nx - 0.5 * t), 2);
  const flake = snowfall(p, t, { fall: 0.26, freq: 5, trail: 0.4, sway: 0.14, wind: 0.8 });
  return { a: 0.14 + 0.86 * band * Math.pow(flake, 1.8), p: 0.7 * p.offset };
}

function lcg(seed: number) {
  let e = seed >>> 0;
  return () => {
    e = (1664525 * e + 0x3c6ef35f) >>> 0;
    return e / 0xffffffff;
  };
}

function wordmarkSvg(text: string) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg width="1600" height="300" viewBox="0 0 1600 300" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="800" y="235" text-anchor="middle" fill="#F4F4F0" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="240" font-weight="900" letter-spacing="-8">${safe}</text></svg>`;
}

export function ParticleWordmark({
  text = "MODUS",
  colors = DEFAULT_COLORS,
  backgroundColor = "#0c0c0d",
  speed = 2,
  className,
}: ParticleWordmarkProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorKey = JSON.stringify(colors);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;
    const PALETTE: [number, number, number][] = JSON.parse(colorKey);
    const mixPalette = (p: number) => {
      const e = Math.max(0, Math.min(1, p)) * (PALETTE.length - 1);
      const r = Math.floor(e);
      const s = e - r;
      const a = PALETTE[r];
      const b = PALETTE[Math.min(PALETTE.length - 1, r + 1)];
      return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
    };

    let particles: Particle[] = [];
    let maskImg: HTMLImageElement | null = null;
    let tNow = 0;
    let alive = true;

    const makeMask = (w: number, h: number) => {
      if (!maskImg || !maskImg.width || !maskImg.height) return null;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const g = off.getContext("2d");
      if (!g) return null;
      const scale = Math.min(w / maskImg.width, h / maskImg.height);
      const dw = maskImg.width * scale;
      const dh = maskImg.height * scale;
      g.drawImage(maskImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
      const data = g.getImageData(0, 0, w, h).data;
      return (x: number, y: number) => {
        const ix = Math.min(w - 1, Math.max(0, Math.round(x)));
        const iy = Math.min(h - 1, Math.max(0, Math.round(y)));
        const i = (iy * w + ix) * 4;
        const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        return Math.pow(lum * (data[i + 3] / 255), GAMMA);
      };
    };

    const rebuild = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sample = makeMask(w, h);
      const rand = lcg(SEED);
      const cols = Math.ceil(w / GAP);
      const rows = Math.ceil(h / GAP);
      const ox = (w - (cols - 1) * GAP) / 2;
      const oy = (h - (rows - 1) * GAP) / 2;
      particles = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const format = FORMATS[Math.floor(rand() * FORMATS.length)];
          const range = rand() < BIG_CHANCE ? SIZE_BIG : SIZE_SMALL;
          const size = range[0] + rand() * (range[1] - range[0]);
          const px = ox + x * GAP;
          const py = oy + y * GAP;
          rand(); // phase
          rand(); // speed
          particles.push({
            cx: px,
            cy: py,
            nx: cols > 1 ? x / (cols - 1) : 0.5,
            ny: rows > 1 ? y / (rows - 1) : 0.5,
            format,
            size,
            offset: rand(),
            mask: sample ? sample(px, py) : 1,
          });
        }
      }
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        const field = squall(p, t);
        const rgb = mixPalette(field.p);
        let alpha = Math.max(0, Math.min(1, field.a));
        if (p.mask < 1) alpha = p.mask * (0.3 + 0.7 * alpha);
        if (alpha <= 0.005) continue;
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
        const r = p.size / 2;
        if (p.format === "square") ctx.fillRect(p.cx - r, p.cy - r, p.size, p.size);
        else {
          ctx.beginPath();
          ctx.arc(p.cx, p.cy, r, 0, TAU);
          ctx.fill();
        }
      }
    };
    const apply = () => render(tNow * speed);

    const img = new Image();
    img.onload = () => {
      if (!alive) return;
      maskImg = img;
      rebuild();
      apply();
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(wordmarkSvg(text));

    rebuild();
    apply();

    let lastW = host.clientWidth;
    let lastH = host.clientHeight;
    const ro = new ResizeObserver(() => {
      if (host.clientWidth !== lastW || host.clientHeight !== lastH) {
        lastW = host.clientWidth;
        lastH = host.clientHeight;
        rebuild();
        apply();
      }
    });
    ro.observe(host);

    let raf = 0;
    let last = -1;
    let visible = true;
    const tick = (now: number) => {
      if (last >= 0) tNow = (tNow + (now - last) / 1000) % DUR;
      last = now;
      apply();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (prefersReducedMotion || raf || !visible || document.hidden) return;
      last = -1;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { rootMargin: "120px" },
    );
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => {
      alive = false;
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [text, colorKey, speed, prefersReducedMotion]);

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        className,
      )}
      style={{ background: backgroundColor }}
    >
      <div
        ref={hostRef}
        role="img"
        aria-label={text}
        className="relative z-[1] m-auto select-none overflow-hidden"
        style={{ width: "min(calc(100% - 48px), 1180px)", aspectRatio: "16 / 3" }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
    </div>
  );
}
