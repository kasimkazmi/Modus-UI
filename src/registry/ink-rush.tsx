"use client";
// Ported from ThreeUI Community's Particle Network (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface InkRushProps {
  className?: string;
  speed?: number;
  size?: number;
  length?: number;
  density?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  backgroundColor?: string;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const scaleCount = (base: number, density: number, minimum: number) =>
  Math.max(minimum, Math.round(base * density));

const SPEED_MULTIPLIER = 1.1;
const readToken = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function InkRush({
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
}: InkRushProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 3);

  const [themeKey, setThemeKey] = useState(0);
  const safeSize = clamp(size, 0.05, 200);
  const safeLength = clamp(length, 0.35, 2.5);
  const safeDensity = clamp(density, 0.25, 2.5);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;

    const particleCount = scaleCount(200, safeDensity, 40);
    const fov = Math.round(300 / Math.max(0.4, safeSize));
    // Trails fade into the page colour; streaks alternate between ink and accent.
    const fade = `hsl(${readToken("--background")} / 0.5)`;
    const hues = [
      readToken("--foreground"),
      readToken("--primary"),
      readToken("--muted-foreground"),
    ];

    let width = 0;
    let height = 0;
    let originX = 0;
    let originY = 0;

    type P = {
      x: number;
      y: number;
      z: number;
      speed: number;
      rgb: string;
      length: number;
    };
    const reset = (p: P) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 600;
      p.x = Math.cos(angle) * radius;
      p.y = Math.sin(angle) * radius + 120;
      p.z = 1000;
      p.speed = (Math.random() * 2 + 1) * SPEED_MULTIPLIER;
      p.rgb = hues[Math.floor(Math.random() * hues.length)];
      p.length = (Math.random() * 2 + 0.5) * safeLength;
    };
    const particles: P[] = Array.from({ length: particleCount }, () => {
      const p = { x: 0, y: 0, z: 0, speed: 0, rgb: "", length: 0 };
      reset(p);
      p.z = Math.random() * 1000;
      return p;
    });

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      originX = width / 2;
      originY = height * 0.32;
    };

    const drawParticle = (p: P) => {
      const scale = fov / p.z;
      const px = originX + p.x * scale;
      const py = originY + p.y * scale;
      const prevZ = p.z + p.speed * p.length;
      const prevScale = fov / prevZ;
      const prevPx = originX + p.x * prevScale;
      const prevPy = originY + p.y * prevScale;

      let alpha = 1 - p.z / 1000;
      if (p.z < 100) alpha = p.z / 100;
      if (alpha < 0) alpha = 0;

      ctx.beginPath();
      ctx.moveTo(prevPx, prevPy);
      ctx.lineTo(px, py);
      ctx.strokeStyle = `hsl(${p.rgb} / ${alpha * 0.9})`;
      ctx.lineWidth = Math.max(0.4, (1 - p.z / 1000) * 1.2);
      ctx.lineCap = "round";
      ctx.lineJoin = "miter";
      ctx.stroke();
    };

    const frame = (s: number) => {
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, width, height);
      particles.forEach((p) => {
        p.z -= p.speed * s;
        if (p.z <= 0) reset(p);
        drawParticle(p);
      });
    };

    const still = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < 6; i++) frame(1);
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
      if (prefersReducedMotion) still();
      else if (inView && !document.hidden) raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) still();
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(host);
    document.addEventListener("visibilitychange", sync);
    sync();
    const themeObserver = new MutationObserver(() => setThemeKey((key) => key + 1));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "data-palette"],
    });

    return () => {
      themeObserver.disconnect();
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [themeKey, safeSize, safeLength, safeDensity, prefersReducedMotion]);

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
