"use client";
// Ported from ThreeUI Community's Particle Network (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ParticleNetworkProps {
  className?: string;
  mode?: "dark" | "light";
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

export function ParticleNetwork({
  className,
  mode = "dark",
  speed = 1,
  size = 1,
  length = 1,
  density = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  backgroundColor,
}: ParticleNetworkProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 3);

  const light = mode === "light";
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
    const fade = light ? "rgba(238, 241, 246, 0.55)" : "rgba(0, 0, 0, 0.45)";
    const hues = light ? ["36, 48, 68", "37, 99, 235"] : ["200, 220, 255", "106, 157, 237"];

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
      p.y = Math.sin(angle) * radius - 150;
      p.z = 1000;
      p.speed = (Math.random() * 2 + 1) * SPEED_MULTIPLIER;
      p.rgb = Math.random() > 0.5 ? hues[0] : hues[1];
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
      originY = height * 0.7;
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
      ctx.strokeStyle = `rgba(${p.rgb}, ${alpha * 0.9})`;
      ctx.lineWidth = Math.max(0.25, (1 - p.z / 1000) * 0.4);
      ctx.lineCap = "butt";
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

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [light, safeSize, safeLength, safeDensity, prefersReducedMotion]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        background: backgroundColor ?? (light ? "#eef1f6" : "#05070d"),
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
