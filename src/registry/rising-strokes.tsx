"use client";
// Ported from ThreeUI Community's Defense Lines (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tokens = {
  primary: string;
  foreground: string;
  muted: string;
  background: string;
  card: string;
  border: string;
  dark: boolean;
};

/** Reads the Modus theme tokens (bare HSL channels) as comma `hsl()` strings canvas and three.js both parse. */
function readTokens(): Tokens {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const hsl = (name: string) =>
    `hsl(${cs
      .getPropertyValue(name)
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .join(", ")})`;
  return {
    primary: hsl("--primary"),
    foreground: hsl("--foreground"),
    muted: hsl("--muted-foreground"),
    background: hsl("--background"),
    card: hsl("--card"),
    border: hsl("--border"),
    dark: root.classList.contains("dark") || root.dataset.theme === "dark",
  };
}

/** The current theme tokens, re-read whenever the mode or palette on <html> changes. */
function useTokens() {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  useEffect(() => {
    const update = () => setTokens(readTokens());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return tokens;
}

export interface RisingStrokesProps {
  className?: string;
  speed?: number;
  size?: number;
  length?: number;
  density?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Background behind the strokes. Defaults to the theme's `--background`. */
  backgroundColor?: string;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
/** `hsl(h, s%, l%)` with an alpha channel. */
const alpha = (color: string, a: number) =>
  color.replace(/^hsl\((.*)\)$/, `hsla($1, ${a.toFixed(3)})`);
const scaleCount = (base: number, density: number, minimum: number) =>
  Math.max(minimum, Math.round(base * density));

export function RisingStrokes({
  className,
  speed = 1,
  size = 1,
  length = 1,
  density = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  backgroundColor,
}: RisingStrokesProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 3);

  const tokens = useTokens();
  const ink = tokens?.primary;
  const thread = tokens?.muted;
  const safeSize = clamp(size, 0.05, 200);
  const safeLength = clamp(length, 0.35, 2.5);
  const safeDensity = clamp(density, 0.25, 2.5);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx || !ink || !thread) return;

    const lineWidth = Number((0.9 * safeSize).toFixed(2));

    let width = 0;
    let height = 0;
    let particles: {
      x: number;
      y: number;
      baseLength: number;
      speedY: number;
      baseOpacity: number;
    }[] = [];

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      const count = width < 768 ? scaleCount(40, safeDensity, 8) : scaleCount(100, safeDensity, 16);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        baseLength: (Math.random() * 80 + 20) * safeLength,
        speedY: Math.random() * 0.8 + 0.2,
        baseOpacity: Math.random() * 0.2 + 0.05,
      }));
    };

    const frame = (s: number) => {
      ctx.clearRect(0, 0, width, height);
      // Strokes gather and brighten along a horizon line below the middle of the frame.
      const horizon = height * 0.62;
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";

      particles.forEach((p) => {
        const proximityY = Math.max(0, 1 - Math.abs(p.y - horizon) / (height * 0.45));
        const centerProximity = Math.pow(proximityY, 1.6);
        const currentLength = p.baseLength * (1 + centerProximity * 2.5);
        const currentOpacity = Math.min(1.0, p.baseOpacity * 2 + centerProximity * 1.2);
        const color = centerProximity > 0.45 ? ink : thread;

        ctx.beginPath();
        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + currentLength);
        grad.addColorStop(0, alpha(color, currentOpacity));
        grad.addColorStop(1, alpha(color, 0));
        ctx.strokeStyle = grad;
        ctx.lineWidth = lineWidth;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + currentLength);
        ctx.stroke();

        p.y -= p.speedY * 1.5 * (1 - centerProximity * 0.45) * s;
        if (p.y + currentLength < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
      });
    };

    let raf = 0;
    let inView = true;
    const loop = () => {
      frame(speedRef.current);
      raf = requestAnimationFrame(loop);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (prefersReducedMotion) frame(0);
      else if (inView && !document.hidden) raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) frame(0);
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(host);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ink, thread, safeSize, safeLength, safeDensity, prefersReducedMotion]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        background: backgroundColor ?? "hsl(var(--background))",
        filter,
      }}
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
