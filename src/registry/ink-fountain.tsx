"use client";
// Ported from ThreeUI Community's Connectivity Graph (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface InkFountainProps {
  className?: string;
  speed?: number;
  size?: number;
  length?: number;
  density?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** CSS background. Defaults to the theme background. */
  backgroundColor?: string;
}

const TOKENS = [
  "primary",
  "foreground",
  "background",
  "muted-foreground",
  "border",
  "card",
] as const;
type Tokens = Record<(typeof TOKENS)[number], string>;

/** Bare HSL channels of the Modus theme tokens, re-read when the theme or palette changes. */
function useThemeTokens(): Tokens | null {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const style = getComputedStyle(root);
      const next = Object.fromEntries(
        TOKENS.map((name) => [name, style.getPropertyValue(`--${name}`).trim()]),
      ) as Tokens;
      setTokens((prev) => (prev && TOKENS.every((k) => prev[k] === next[k]) ? prev : next));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return tokens;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const scaleCount = (base: number, density: number, minimum: number) =>
  Math.max(minimum, Math.round(base * density));

export function InkFountain({
  className,
  speed = 0.7,
  size = 0.8,
  length = 1.2,
  density = 0.8,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  backgroundColor,
}: InkFountainProps) {
  const tokens = useThemeTokens();
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 3);

  const safeSize = clamp(size, 0.05, 200);
  const safeLength = clamp(length, 0.35, 2.5);
  const safeDensity = clamp(density, 0.25, 2.5);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!host || !canvas || !ctx || !tokens) return;
    const ink = tokens.primary;
    const tail = tokens["muted-foreground"];
    const head = tokens.foreground;

    let width = 0;
    let height = 0;

    type P = {
      angle: number;
      speed: number;
      distance: number;
      maxLength: number;
      length: number;
      alpha: number;
    };
    let particles: P[] = [];

    const reset = (p: P, initial = false) => {
      // Fan rightward from a source on the left edge.
      p.angle = -Math.PI * 0.5 + Math.random() * Math.PI;
      if (Math.random() > 0.3) {
        p.angle = -Math.PI * 0.22 + Math.random() * Math.PI * 0.36;
      }
      p.speed = 0.5 + Math.random() * 2.5;
      p.distance = initial ? Math.random() * (width * 1.1) : Math.random() * 50;
      p.maxLength = (20 + Math.random() * 180) * safeLength;
      p.length = 0;
      p.alpha = 0;
    };

    const update = (p: P, s: number) => {
      p.distance += p.speed * s;
      p.length = Math.min(p.maxLength, p.distance * 0.8);
      const normalizedDist = p.distance / (width * 1.1);
      p.alpha = Math.min(1, p.distance / 100) * Math.max(0, 1 - normalizedDist);
      if (p.distance > width * 1.3) reset(p);
    };

    const draw = (p: P) => {
      const originX = -40;
      const originY = height * 0.62;
      const startX = originX + Math.cos(p.angle) * p.distance;
      const startY = originY + Math.sin(p.angle) * p.distance;
      const endX = originX + Math.cos(p.angle) * (p.distance + p.length);
      const endY = originY + Math.sin(p.angle) * (p.distance + p.length);

      const distRatio = Math.min(1, p.distance / width);
      const color = `hsl(${ink} / ${p.alpha * 0.85})`;
      const tailColor = `hsl(${tail} / ${p.alpha * 0.06})`;

      ctx.beginPath();
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, tailColor);
      gradient.addColorStop(1, color);
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = (0.5 + distRatio * 2) * safeSize;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(endX, endY, 0.5 + distRatio * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${head} / ${Math.min(1, p.alpha * 1.2)})`;
      ctx.fill();
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count =
        width < 768 ? scaleCount(150, safeDensity, 30) : scaleCount(400, safeDensity, 60);
      particles = Array.from({ length: count }, () => {
        const p = {
          angle: 0,
          speed: 0,
          distance: 0,
          maxLength: 0,
          length: 0,
          alpha: 0,
        };
        reset(p, true);
        return p;
      });
    };

    const frame = (s: number) => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        update(p, s);
        draw(p);
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
  }, [tokens, safeSize, safeLength, safeDensity, prefersReducedMotion]);

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
