"use client";
// Ported from ThreeUI Community's Flow Field (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DriftLinesProps {
  speed?: number;
  size?: number;
  length?: number;
  density?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Line colours; defaults to five inks on the theme's primary hue. */
  colors?: string[];
  /** Colour behind the lines; defaults to the theme background. */
  backgroundColor?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type RGB = { r: number; g: number; b: number };

type Hsl = [number, number, number];

/** Theme tokens are bare HSL channels ("24 8% 20%"). */
function readTheme() {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string): Hsl => {
    const [h = 0, s = 0, l = 0] = style
      .getPropertyValue(name)
      .trim()
      .split(/[\s,/%]+/)
      .map(Number);
    return [h, s, l];
  };
  const background = read("--background");
  return {
    dark: background[2] < 50,
    background,
    foreground: read("--foreground"),
    primary: read("--primary"),
    muted: read("--muted-foreground"),
  };
}

/** Comma-separated hsl(), which both canvas and THREE.Color parse. */
const hsl = ([h, s, l]: Hsl, alpha = 1) =>
  `hsla(${Math.round(h)}, ${Math.round(Math.min(100, Math.max(0, s)))}%, ${Math.round(Math.min(100, Math.max(0, l)))}%, ${alpha})`;

/** Bumps on light/dark or palette changes so canvas colours re-resolve. */
function useThemeVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setVersion((v) => v + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return version;
}

/** Any CSS colour to RGB, by letting a 1px canvas parse it. */
function toRgb(color: string): RGB {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return { r: 0, g: 0, b: 0 };
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return { r, g, b };
}

/** Five inks on the primary hue: deep to light on a dark ground, light to deep on paper. */
function themeInks(): string[] {
  const { dark, primary } = readTheme();
  const [h, s] = primary;
  const sat = Math.max(s, dark ? 14 : 38);
  const steps = dark ? [40, 54, 68, 80, 92] : [16, 26, 36, 46, 56];
  return steps.map((l, i) => hsl([h - 30 + i * 10, sat + i * 4, l]));
}

// Simplex noise (compact implementation), based on Stefan Gustavson's simplex noise.
const F3 = 1 / 3;
const G3 = 1 / 6;
const GRAD3 = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1],
];

function createNoise3D(initialSeed: number) {
  const perm = new Uint8Array(512);
  const permMod12 = new Uint8Array(512);
  const p = new Uint8Array(256);
  let seed = initialSeed;
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807 + 0) % 2147483647;
    const j = seed % (i + 1);
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }

  return (xin: number, yin: number, zin: number) => {
    let n0, n1, n2, n3;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s),
      j = Math.floor(yin + s),
      k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const x0 = xin - (i - t),
      y0 = yin - (j - t),
      z0 = zin - (k - t);
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 1, 0];
      else if (x0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 0, 1];
      else [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 1, 0, 1];
    } else {
      if (y0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 0, 1, 1];
      else if (x0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 0, 1, 1];
      else [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 1, 1, 0];
    }
    const x1 = x0 - i1 + G3,
      y1 = y0 - j1 + G3,
      z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3,
      y2 = y0 - j2 + 2 * G3,
      z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3,
      y3 = y0 - 1 + 3 * G3,
      z3 = z0 - 1 + 3 * G3;
    const ii = i & 255,
      jj = j & 255,
      kk = k & 255;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0;
    else {
      t0 *= t0;
      const g = GRAD3[permMod12[ii + perm[jj + perm[kk]]]];
      n0 = t0 * t0 * (g[0] * x0 + g[1] * y0 + g[2] * z0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0;
    else {
      t1 *= t1;
      const g = GRAD3[permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]]];
      n1 = t1 * t1 * (g[0] * x1 + g[1] * y1 + g[2] * z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0;
    else {
      t2 *= t2;
      const g = GRAD3[permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]]];
      n2 = t2 * t2 * (g[0] * x2 + g[1] * y2 + g[2] * z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0;
    else {
      t3 *= t3;
      const g = GRAD3[permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]]];
      n3 = t3 * t3 * (g[0] * x3 + g[1] * y3 + g[2] * z3);
    }
    return 32 * (n0 + n1 + n2 + n3);
  };
}

export function DriftLines({
  speed = 1,
  size = 1,
  length = 1,
  density = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  colors,
  backgroundColor,
  className,
}: DriftLinesProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useThemeVersion();
  const options = useRef({ speed, size, length, colors, backgroundColor });
  options.current = { speed, size, length, colors, backgroundColor };
  const particleCount = Math.max(300, Math.round(2500 * clamp(density, 0.25, 2.5)));

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!host || !canvas || !context) return;
    const ctx: CanvasRenderingContext2D = context;

    const noise3D = createNoise3D(42);
    const SPEED = 1.2;
    const MOUSE_RADIUS = 150;
    const MOUSE_FORCE = 2.5;
    let W = 0;
    let H = 0;
    let time = 0;
    let frame = 0;
    let visible = true;
    const mouse = { x: -9999, y: -9999, active: false };
    let particles: { x: number; y: number; speed: number; alpha: number; size: number }[] = [];

    // Resolved once per change of colours or theme, not per particle.
    let colorKey = "";
    let palette: RGB[] = [];
    let bg: RGB = { r: 0, g: 0, b: 0 };
    const resolveColors = () => {
      const { colors: custom, backgroundColor: ground } = options.current;
      const key = JSON.stringify([custom, ground]);
      if (key === colorKey) return;
      colorKey = key;
      palette = (custom?.length ? custom : themeInks()).map(toRgb);
      bg = toRgb(ground ?? hsl(readTheme().background));
    };
    resolveColors();

    const fillBackground = () => {
      ctx.fillStyle = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
      ctx.fillRect(0, 0, W, H);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = host.offsetWidth;
      H = host.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Fill with background on resize to avoid flash
      fillBackground();
      if (prefersReducedMotion) for (let i = 0; i < 120; i++) step();
    };
    resize();

    particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 0.4 + Math.random() * 1.0,
      alpha: 0.15 + Math.random() * 0.55,
      size: 0.5 + Math.random() * 1.5,
    }));

    function getColor(noiseVal: number) {
      // Map noise [-1,1] to palette index
      const t = (noiseVal + 1) * 0.5;
      const idx = t * (palette.length - 1);
      const i = Math.floor(idx);
      const f = idx - i;
      const a = palette[Math.min(i, palette.length - 1)];
      const b = palette[Math.min(i + 1, palette.length - 1)];
      return { r: a.r + (b.r - a.r) * f, g: a.g + (b.g - a.g) * f, b: a.b + (b.b - a.b) * f };
    }

    function step() {
      const o = options.current;
      const speedScale = clamp(o.speed, 0, 3);
      const noiseScale = Number((0.0025 / clamp(o.length, 0.35, 2.5)).toFixed(6));
      const lineScale = Number(clamp(o.size, 0.05, 200).toFixed(3));
      resolveColors();

      // Fade the previous frame toward the ground — creates trailing effect
      ctx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, 0.03)`;
      ctx.fillRect(0, 0, W, H);
      time += 0.0008 * speedScale;

      for (const p of particles) {
        const nx = p.x * noiseScale;
        const ny = p.y * noiseScale;
        const angle = noise3D(nx, ny, time) * Math.PI * 2;
        const colorNoise = noise3D(nx * 1.5 + 100, ny * 1.5 + 100, time * 0.5);
        let vx = Math.cos(angle) * p.speed * SPEED * speedScale;
        let vy = Math.sin(angle) * p.speed * SPEED * speedScale;

        // Mouse interaction — gentle push away
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
            vx += (dx / dist) * force;
            vy += (dy / dist) * force;
          }
        }

        const px = p.x;
        const py = p.y;
        p.x += vx;
        p.y += vy;

        const color = getColor(colorNoise);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)},${p.alpha})`;
        ctx.lineWidth = p.size * lineScale;
        ctx.stroke();

        // Respawn if offscreen
        if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
        }
      }
    }

    const tick = () => {
      step();
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!prefersReducedMotion && visible && !document.hidden && !frame)
        frame = requestAnimationFrame(tick);
    };

    // Listen on window so content layered above the field still steers it.
    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      mouse.x = event.clientX - bounds.left;
      mouse.y = event.clientY - bounds.top;
      mouse.active =
        mouse.x >= 0 && mouse.y >= 0 && mouse.x <= bounds.width && mouse.y <= bounds.height;
    };
    const onPointerLeave = () => {
      mouse.active = false;
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    const onVisibility = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    resizeObserver.observe(host);
    intersection.observe(host);
    if (prefersReducedMotion) for (let i = 0; i < 120; i++) step();
    start();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [prefersReducedMotion, particleCount, theme]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background: backgroundColor ?? "hsl(var(--background))", filter }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 block h-full w-full"
        style={{ opacity: clamp(opacity, 0.05, 1) }}
      />
    </div>
  );
}
