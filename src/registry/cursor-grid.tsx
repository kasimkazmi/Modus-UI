"use client";
// Canvas grid whose cells glow near the cursor and ripple outward on click.

import * as React from "react";
import { useAnimationFrame, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Falloff = "linear" | "exponential" | "gaussian";

export interface CursorGridProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  cellSize?: number;
  radius?: number;
  falloff?: Falloff;
  holdTime?: number;
  fadeDuration?: number;
  lineWidth?: number;
  maxOpacity?: number;
  fillOpacity?: number;
  gridOpacity?: number;
  cellRadius?: number;
  clickPulse?: boolean;
  pulseSpeed?: number;
}

const strength = (d: number, radius: number, falloff: Falloff) => {
  const t = d / radius;
  if (t >= 1) return 0;
  if (falloff === "linear") return 1 - t;
  if (falloff === "exponential") return Math.exp(-4 * t);
  return Math.exp(-(t * t) * 4);
};

interface Field {
  cols: number;
  rows: number;
  heat: Float32Array;
  litAt: Float64Array;
}

export function CursorGrid({
  color = "hsl(var(--primary))",
  cellSize = 32,
  radius = 120,
  falloff = "gaussian",
  holdTime = 0,
  fadeDuration = 600,
  lineWidth = 1,
  maxOpacity = 1,
  fillOpacity = 0.1,
  gridOpacity = 0.05,
  cellRadius = 4,
  clickPulse = true,
  pulseSpeed = 800,
  className,
  ...props
}: CursorGridProps) {
  const reduceMotion = useReducedMotion();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pointer = React.useRef<{ x: number; y: number } | null>(null);
  const pulses = React.useRef<{ x: number; y: number; start: number }[]>([]);
  const field = React.useRef<Field>({
    cols: 0,
    rows: 0,
    heat: new Float32Array(),
    litAt: new Float64Array(),
  });
  const rgb = React.useRef("0, 0, 0");

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const probe = document.createElement("span");
    probe.style.color = color;
    canvas.parentElement!.appendChild(probe);
    rgb.current = getComputedStyle(probe)
      .color.replace(/rgba?\(|\)/g, "")
      .split(",")
      .slice(0, 3)
      .join(",");
    probe.remove();
  }, [color]);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);
      field.current = {
        cols,
        rows,
        heat: new Float32Array(cols * rows),
        litAt: new Float64Array(cols * rows),
      };
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [cellSize]);

  useAnimationFrame((_, delta) => {
    const now = performance.now();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { cols, rows, heat, litAt } = field.current;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    const ringWidth = cellSize * 1.5;
    const reach = Math.hypot(w, h);
    pulses.current = pulses.current.filter((p) => now - p.start < pulseSpeed);

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = lineWidth;
    const inset = lineWidth / 2;
    const size = cellSize - lineWidth;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        const cx = col * cellSize + cellSize / 2;
        const cy = row * cellSize + cellSize / 2;
        let target = 0;
        if (pointer.current) {
          target = strength(
            Math.hypot(cx - pointer.current.x, cy - pointer.current.y),
            radius,
            falloff,
          );
        }
        for (const p of pulses.current) {
          const ring = ((now - p.start) / pulseSpeed) * reach;
          const off = Math.abs(Math.hypot(cx - p.x, cy - p.y) - ring);
          if (off < ringWidth)
            target = Math.max(target, (1 - off / ringWidth) * (1 - ring / reach));
        }
        if (target >= heat[i]) {
          heat[i] = target;
          litAt[i] = now;
        } else if (reduceMotion || fadeDuration <= 0) {
          heat[i] = target;
        } else if (now - litAt[i] > holdTime) {
          heat[i] = Math.max(target, heat[i] - delta / fadeDuration);
        }

        const level = heat[i] * maxOpacity;
        ctx.beginPath();
        ctx.roundRect(col * cellSize + inset, row * cellSize + inset, size, size, cellRadius);
        ctx.strokeStyle = `rgba(${rgb.current}, ${Math.max(gridOpacity, level)})`;
        ctx.stroke();
        if (level > 0.01) {
          ctx.fillStyle = `rgba(${rgb.current}, ${level * fillOpacity})`;
          ctx.fill();
        }
      }
    }
  });

  const local = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      onPointerMove={(e) => (pointer.current = local(e))}
      onPointerLeave={() => (pointer.current = null)}
      onPointerDown={(e) => {
        if (clickPulse && !reduceMotion)
          pulses.current.push({ ...local(e), start: performance.now() });
      }}
      {...props}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
