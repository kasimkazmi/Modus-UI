"use client";
// Card whose canvas pixels bloom outward from the centre and shimmer while hovered or focused.

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "default" | "blue" | "yellow" | "pink";

export interface PixelCardProps {
  variant?: Variant;
  gap?: number;
  speed?: number;
  colors?: string;
  noFocus?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const PRESETS: Record<Variant, { gap: number; speed: number; colors: string; noFocus: boolean }> = {
  default: { gap: 5, speed: 35, colors: "#e2e8f0,#94a3b8,#64748b", noFocus: false },
  blue: { gap: 10, speed: 25, colors: "#e0f2fe,#7dd3fc,#0ea5e9", noFocus: false },
  yellow: { gap: 3, speed: 20, colors: "#fef08a,#fde047,#eab308", noFocus: false },
  pink: { gap: 6, speed: 80, colors: "#fecdd3,#fda4af,#e11d48", noFocus: true },
};

interface Pixel {
  x: number;
  y: number;
  color: string;
  delay: number;
  size: number;
  phase: number;
}

export function PixelCard({
  variant = "default",
  gap,
  speed,
  colors,
  noFocus,
  className,
  children,
}: PixelCardProps) {
  const preset = PRESETS[variant];
  const cellGap = Math.max(gap ?? preset.gap, 2);
  const shimmer = (speed ?? preset.speed) / 1000;
  const palette = colors ?? preset.colors;
  const skipFocus = noFocus ?? preset.noFocus;
  const reduceMotion = useReducedMotion();

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const setActive = React.useRef<(on: boolean) => void>(() => {});

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const list = palette.split(",").map((c) => c.trim());
    const maxSize = 2;
    let pixels: Pixel[] = [];
    let width = 0;
    let height = 0;
    let active = false;
    let activeSince = 0;
    let frame = 0;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pixels = [];
      for (let x = 0; x < width; x += cellGap) {
        for (let y = 0; y < height; y += cellGap) {
          pixels.push({
            x,
            y,
            color: list[Math.floor(Math.random() * list.length)],
            delay: reduceMotion ? 0 : Math.hypot(x - width / 2, y - height / 2) * 2,
            size: 0,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const tick = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      const elapsed = now - activeSince;
      let visible = false;
      for (const p of pixels) {
        const target =
          active && elapsed > p.delay
            ? reduceMotion
              ? maxSize * 0.75
              : maxSize * (0.6 + 0.4 * Math.sin(now * shimmer * 0.1 + p.phase))
            : 0;
        p.size += reduceMotion ? target - p.size : (target - p.size) * 0.12;
        if (p.size < 0.05) continue;
        visible = true;
        const offset = (maxSize - p.size) / 2;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x + offset, p.y + offset, p.size, p.size);
      }
      frame = active || visible ? requestAnimationFrame(tick) : 0;
    };

    setActive.current = (on) => {
      active = on;
      activeSince = performance.now();
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const observer = new ResizeObserver(build);
    observer.observe(canvas);
    build();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [cellGap, shimmer, palette, reduceMotion]);

  return (
    <div
      tabIndex={skipFocus ? -1 : 0}
      className={cn(
        "relative isolate aspect-[4/5] w-[300px] overflow-hidden rounded-[25px] border border-border bg-card outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
        className,
      )}
      onPointerEnter={() => setActive.current(true)}
      onPointerLeave={() => setActive.current(false)}
      onFocus={(event) => {
        if (!skipFocus && event.target === event.currentTarget) setActive.current(true);
      }}
      onBlur={() => !skipFocus && setActive.current(false)}
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
      {children}
    </div>
  );
}
