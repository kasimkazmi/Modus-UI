"use client";
// Ported from ThreeUI Community's Gateway Flow (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GatewayFlowProps {
  className?: string;
  mode?: "dark" | "light";
  speed?: number;
  size?: number;
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

type Pt = { x: number; y: number };

function getBezierPoint(t: number, p0: Pt, p1: Pt, p2: Pt, p3: Pt): Pt {
  const u = 1 - t;
  return {
    x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}

export function GatewayFlow({
  className,
  mode = "dark",
  speed = 1,
  size = 1,
  density = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  backgroundColor,
}: GatewayFlowProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 3);

  const light = mode === "light";
  const safeSize = clamp(size, 0.05, 200);
  const safeDensity = clamp(density, 0.25, 2.5);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;

    const stroke = light ? "rgba(26, 31, 42, 0.4)" : "rgba(255, 255, 255, 0.35)";
    const fill = light ? "rgba(26, 31, 42, 0.75)" : "rgba(255, 255, 255, 0.7)";
    const lineWidth = Number((1.2 * safeSize).toFixed(2));
    const numPaths = scaleCount(80, safeDensity, 12);

    let width = 0;
    let height = 0;
    let explosions: { x: number; y: number; radius: number; life: number }[] = [];
    const paths: {
      isLeft: boolean;
      startY: number;
      particles: { t: number; speed: number }[];
    }[] = [];

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!paths.length && height > 0) {
        for (let i = 0; i < numPaths; i++) {
          paths.push({
            isLeft: i % 2 === 0,
            startY: (i / numPaths) * height * 1.4 - height * 0.2,
            particles: [{ t: Math.random(), speed: 0.0015 + Math.random() * 0.002 }],
          });
        }
      }
    };

    const render = (s: number) => {
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      explosions.forEach((exp) => {
        exp.radius += 15;
        exp.life -= 0.015;
      });
      explosions = explosions.filter((exp) => exp.life > 0);

      paths.forEach((path) => {
        const p0 = { x: path.isLeft ? 0 : width, y: path.startY };
        const p1 = {
          x: path.isLeft ? centerX * 0.5 : width - centerX * 0.5,
          y: path.startY,
        };
        const p2 = {
          x: path.isLeft ? centerX * 0.8 : width - centerX * 0.8,
          y: centerY,
        };
        const p3 = { x: centerX, y: centerY };

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([1, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        path.particles.forEach((p) => {
          p.t += p.speed * s;
          if (p.t > 1) {
            p.t = 0;
            path.startY += (Math.random() - 0.5) * 10;
          }
          const pos = getBezierPoint(p.t, p0, p1, p2, p3);
          let dxTotal = 0;
          let dyTotal = 0;
          explosions.forEach((exp) => {
            const dx = pos.x - exp.x;
            const dy = pos.y - exp.y;
            const dist = Math.hypot(dx, dy);
            if (dist < exp.radius + 120 && dist > exp.radius - 120) {
              const force = (1 - Math.abs(dist - exp.radius) / 120) * exp.life;
              dxTotal += (dx / dist) * force * 80;
              dyTotal += (dy / dist) * force * 80;
            }
          });
          pos.x += dxTotal;
          pos.y += dyTotal;
          ctx.fillStyle = fill;
          ctx.fillRect(pos.x - 1.5, pos.y - 1.5, 3, 3);
        });
      });
    };

    const onClick = (e: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      explosions.push({ x, y, radius: 0, life: 1 });
    };

    let raf = 0;
    let inView = true;
    const loop = () => {
      render(speedRef.current);
      raf = requestAnimationFrame(loop);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (prefersReducedMotion) render(0);
      else if (inView && !document.hidden) raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) render(0);
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(host);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("click", onClick);
    sync();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("click", onClick);
    };
  }, [light, safeSize, safeDensity, prefersReducedMotion]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        background: backgroundColor ?? (light ? "#eef1f6" : "#000000"),
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
