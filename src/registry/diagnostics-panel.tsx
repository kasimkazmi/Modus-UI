"use client";
// Ported from ThreeUI Community's Diagnostics Panel (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type DiagnosticsPanelVariant = "layers" | "nodes" | "flow";

interface DiagnosticsPanelProps {
  variant?: DiagnosticsPanelVariant;
  mode?: "dark" | "light";
  speed?: number;
  size?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

type Ctx = CanvasRenderingContext2D;
type Ink = (alpha: number) => string;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

const projectIso = (x: number, y: number, z: number) => {
  const angle = Math.PI / 6;
  return { x: (x - z) * Math.cos(angle), y: y + (x + z) * Math.sin(angle) };
};

function drawLayers(ctx: Ctx, t: number, ink: Ink, paper: string) {
  const size = 42;
  const layers = 5;
  const gap = 20;
  ctx.lineWidth = 1;
  for (let i = layers - 1; i >= 0; i--) {
    const yOff = i * gap - (layers * gap) / 2 + Math.sin(t + i * 0.4) * 4;
    const p1 = projectIso(-size, yOff, -size);
    const p2 = projectIso(size, yOff, -size);
    const p3 = projectIso(size, yOff, size);
    const p4 = projectIso(-size, yOff, size);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();

    ctx.fillStyle = paper;
    ctx.fill();
    ctx.strokeStyle = i === 0 ? ink(0.8) : ink(0.15);
    ctx.stroke();

    if (i === 0) {
      ctx.save();
      const center = projectIso(0, yOff, 0);
      ctx.translate(center.x, center.y);
      ctx.scale(1, 0.5);
      const sqSize = size * 0.55;
      ctx.beginPath();
      ctx.rect(-sqSize, -sqSize, sqSize * 2, sqSize * 2);
      ctx.strokeStyle = ink(0.4);
      ctx.stroke();
      ctx.clip();
      for (let j = -sqSize; j < sqSize; j += 4) {
        ctx.beginPath();
        ctx.moveTo(-sqSize, j);
        ctx.lineTo(sqSize, j);
        ctx.strokeStyle = ink(0.2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (i < layers - 1) {
      const nextY = (i + 1) * gap - (layers * gap) / 2 + Math.sin(t + (i + 1) * 0.4) * 4;
      const p1Next = projectIso(-size, nextY, -size);
      const p3Next = projectIso(size, nextY, size);
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p1Next.x, p1Next.y);
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p3Next.x, p3Next.y);
      ctx.strokeStyle = ink(0.1);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawCube(ctx: Ctx, x: number, y: number, z: number, s: number, colorStr: string) {
  const pts = [
    projectIso(x - s, y - s, z - s),
    projectIso(x + s, y - s, z - s),
    projectIso(x + s, y - s, z + s),
    projectIso(x - s, y - s, z + s),
    projectIso(x - s, y + s, z - s),
    projectIso(x + s, y + s, z - s),
    projectIso(x + s, y + s, z + s),
    projectIso(x - s, y + s, z + s),
  ];
  ctx.strokeStyle = colorStr;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  ctx.lineTo(pts[1].x, pts[1].y);
  ctx.lineTo(pts[2].x, pts[2].y);
  ctx.lineTo(pts[3].x, pts[3].y);
  ctx.closePath();
  ctx.moveTo(pts[4].x, pts[4].y);
  ctx.lineTo(pts[5].x, pts[5].y);
  ctx.lineTo(pts[6].x, pts[6].y);
  ctx.lineTo(pts[7].x, pts[7].y);
  ctx.closePath();
  ctx.moveTo(pts[0].x, pts[0].y);
  ctx.lineTo(pts[4].x, pts[4].y);
  ctx.moveTo(pts[1].x, pts[1].y);
  ctx.lineTo(pts[5].x, pts[5].y);
  ctx.moveTo(pts[2].x, pts[2].y);
  ctx.lineTo(pts[6].x, pts[6].y);
  ctx.moveTo(pts[3].x, pts[3].y);
  ctx.lineTo(pts[7].x, pts[7].y);
  ctx.stroke();
}

function drawNodes(ctx: Ctx, t: number, ink: Ink) {
  const s = 22;
  const float = Math.sin(t) * 4;
  drawCube(ctx, -35, -float, -35, s, ink(0.15));
  drawCube(ctx, 35, float, -35, s, ink(0.15));
  drawCube(ctx, -35, float, 35, s, ink(0.15));
  drawCube(ctx, 35, -float, 35, s, ink(0.15));
  drawCube(ctx, 0, Math.cos(t) * 6 - 15, 0, s * 0.9, ink(0.6));
}

function drawFlow(ctx: Ctx, t: number, ink: Ink, paper: string) {
  const size = 65;
  const segments = 22;
  const step = (size * 2) / segments;
  ctx.lineWidth = 1;
  const getH = (x: number, z: number) => {
    const dist = Math.sqrt(x * x + z * z);
    const peak = Math.max(0, 45 - dist * 1.1);
    const wave = Math.sin(x * 0.2 + t * 1.5) * Math.cos(z * 0.2 + t * 1.5) * 5;
    return -peak - wave + 15;
  };

  for (let z = -size; z < size; z += step) {
    for (let x = -size; x < size; x += step) {
      const y1 = getH(x, z);
      const y2 = getH(x + step, z);
      const y3 = getH(x + step, z + step);
      const y4 = getH(x, z + step);
      const p1 = projectIso(x, y1, z);
      const p2 = projectIso(x + step, y2, z);
      const p3 = projectIso(x + step, y3, z + step);
      const p4 = projectIso(x, y4, z + step);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fillStyle = paper;
      ctx.fill();

      const heightRatio = Math.max(0, -y1 / 30);
      const alpha = 0.05 + heightRatio * 0.4;
      ctx.strokeStyle = heightRatio > 0.6 ? ink(alpha + 0.3) : ink(alpha + 0.05);
      ctx.stroke();
    }
  }
}

export function DiagnosticsPanel({
  variant = "layers",
  mode = "dark",
  speed = 1,
  size = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  color,
  backgroundColor,
  className,
}: DiagnosticsPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isLight = mode === "light";
  const stroke = color ?? (isLight ? "#047857" : "#34d399");
  const paper = backgroundColor ?? (isLight ? "#eef1f6" : "#020804");
  const live = useRef({ speed });
  live.current = { speed: clamp(speed, 0, 3) };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!host || !canvas || !ctx) return;

    const rgb = hexToRgb(stroke);
    const ink: Ink = (alpha) => `rgba(${rgb},${alpha})`;
    let w = 1;
    let h = 1;
    let time = 0;
    let raf = 0;
    let visible = true;

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2 + 5);
      if (variant === "nodes") drawNodes(ctx, time, ink);
      else if (variant === "flow") drawFlow(ctx, time, ink, paper);
      else drawLayers(ctx, time, ink, paper);
      ctx.restore();
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    };

    const loop = () => {
      time += 0.015 * live.current.speed;
      render();
      raf = requestAnimationFrame(loop);
    };

    const sync = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (!prefersReducedMotion && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
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
  }, [variant, stroke, paper, prefersReducedMotion]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("relative aspect-square w-[360px] max-w-full overflow-hidden", className)}
      style={{
        opacity: clamp(opacity, 0.05, 1),
        transform: size === 1 ? undefined : `scale(${clamp(size, 0.05, 200)})`,
        filter,
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}
