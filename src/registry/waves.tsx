"use client";
// Canvas line field bent by gradient noise and pushed around by the cursor.

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface WavesProps {
  lineColor?: string;
  backgroundColor?: string;
  waveSpeedX?: number;
  waveSpeedY?: number;
  waveAmpX?: number;
  waveAmpY?: number;
  xGap?: number;
  yGap?: number;
  friction?: number;
  tension?: number;
  maxCursorMove?: number;
  style?: React.CSSProperties;
  className?: string;
}

// Small seeded 2D gradient noise in roughly [-1, 1].
const PERM = (() => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let seed = 1337;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p];
})();

function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const corner = (cx: number, cy: number) => {
    const angle = (PERM[(PERM[(xi + cx) & 255] + yi + cy) & 511] / 256) * Math.PI * 2;
    return Math.cos(angle) * (fx - cx) + Math.sin(angle) * (fy - cy);
  };
  const fade = (t: number) => t * t * (3 - 2 * t);
  const u = fade(fx);
  const v = fade(fy);
  const top = corner(0, 0) + (corner(1, 0) - corner(0, 0)) * u;
  const bottom = corner(0, 1) + (corner(1, 1) - corner(0, 1)) * u;
  return (top + (bottom - top) * v) * 1.4;
}

interface Point {
  x: number;
  y: number;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
}

export function Waves({
  lineColor = "rgba(0, 0, 0, 0.2)",
  backgroundColor = "transparent",
  waveSpeedX = 0.0125,
  waveSpeedY = 0.005,
  waveAmpX = 32,
  waveAmpY = 16,
  xGap = 10,
  yGap = 32,
  friction = 0.925,
  tension = 0.005,
  maxCursorMove = 100,
  style = {},
  className,
}: WavesProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let columns: Point[][] = [];
    let width = 0;
    let height = 0;
    const cursor = { x: -1e4, y: -1e4, vx: 0, vy: 0 };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = [];
      for (let x = -xGap; x <= width + xGap; x += xGap) {
        const column: Point[] = [];
        for (let y = -yGap; y <= height + yGap; y += yGap) {
          column.push({ x, y, dx: 0, dy: 0, vx: 0, vy: 0 });
        }
        columns.push(column);
      }
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const column of columns) {
        column.forEach((p, i) => {
          const n = noise((p.x + time * waveSpeedX) * 0.002, (p.y + time * waveSpeedY) * 0.0015);
          if (!reduceMotion) {
            const dist = Math.hypot(p.x - cursor.x, p.y - cursor.y);
            const reach = Math.max(175, Math.hypot(cursor.vx, cursor.vy) * 10);
            if (dist < reach) {
              const push = 1 - dist / reach;
              p.vx += cursor.vx * push * 0.0065;
              p.vy += cursor.vy * push * 0.0065;
            }
            p.vx = (p.vx - p.dx * tension) * friction;
            p.vy = (p.vy - p.dy * tension) * friction;
            p.dx = Math.max(-maxCursorMove, Math.min(maxCursorMove, p.dx + p.vx));
            p.dy = Math.max(-maxCursorMove, Math.min(maxCursorMove, p.dy + p.vy));
          }
          const x = p.x + Math.cos(n * Math.PI * 2) * waveAmpX + p.dx;
          const y = p.y + Math.sin(n * Math.PI) * waveAmpY + p.dy;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      }
      ctx.stroke();
    };

    let frame = 0;
    const tick = (time: number) => {
      cursor.vx *= 0.9;
      cursor.vy *= 0.9;
      draw(time / 16);
      frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (cursor.x > -1e3) {
        cursor.vx = x - cursor.x;
        cursor.vy = y - cursor.y;
      }
      cursor.x = x;
      cursor.y = y;
    };

    const observer = new ResizeObserver(() => {
      build();
      if (reduceMotion) draw(0);
    });
    observer.observe(canvas);
    build();
    if (reduceMotion) draw(0);
    else {
      frame = requestAnimationFrame(tick);
      window.addEventListener("pointermove", onMove);
    }
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [
    lineColor,
    waveSpeedX,
    waveSpeedY,
    waveAmpX,
    waveAmpY,
    xGap,
    yGap,
    friction,
    tension,
    maxCursorMove,
    reduceMotion,
  ]);

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ backgroundColor, ...style }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
