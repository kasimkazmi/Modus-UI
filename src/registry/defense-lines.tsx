"use client";
// Ported from ThreeUI Community's Defense Lines (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DefenseLinesProps {
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

export function DefenseLines({
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
}: DefenseLinesProps) {
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

    const edge = light ? "rgba(153, 27, 27, 0)" : "rgba(220, 38, 38, 0)";
    const lineWidth = Number((0.5 * safeSize).toFixed(2));

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
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";

      particles.forEach((p) => {
        const proximityX = Math.max(0, 1 - Math.abs(p.x - centerX) / (width / 2));
        const proximityY = Math.max(0, 1 - Math.abs(p.y - centerY) / (height / 2));
        const centerProximity = proximityX * (0.4 + proximityY * 0.6);
        const currentLength = p.baseLength * (1 + centerProximity * 4);
        const currentOpacity = Math.min(1.0, p.baseOpacity + centerProximity * 2.0);
        const glow = Math.floor(centerProximity * 180);

        ctx.beginPath();
        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + currentLength);
        grad.addColorStop(0, edge);
        grad.addColorStop(
          0.5,
          light
            ? `rgba(185, ${20 + glow * 0.55}, ${20 + glow * 0.55}, ${currentOpacity})`
            : `rgba(255, ${38 + glow}, ${38 + glow}, ${currentOpacity})`,
        );
        grad.addColorStop(1, edge);
        ctx.strokeStyle = grad;
        ctx.lineWidth = lineWidth;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + currentLength);
        ctx.stroke();

        p.y -= p.speedY * 1.5 * (1 + centerProximity * 0.5) * s;
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
        background: backgroundColor ?? (light ? "#f4ecec" : "#120303"),
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
