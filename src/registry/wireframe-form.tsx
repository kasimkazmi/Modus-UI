"use client";
// Ported from ThreeUI Community's Wireframe Forms (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type WireframeFormVariant = "cube" | "cylinders" | "sphere";

interface WireframeFormProps {
  variant?: WireframeFormVariant;
  mode?: "dark" | "light";
  speed?: number;
  size?: number;
  length?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  color?: string;
  className?: string;
}

type Point = { x: number; y: number; z: number };

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
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function buildShape(shapeType: WireframeFormVariant, length: number) {
  const points: Point[] = [];
  const edges: [number, number][] = [];
  if (shapeType === "cube") {
    const s = Math.round(80 * length);
    points.push(
      { x: s, y: s, z: s },
      { x: -s, y: -s, z: s },
      { x: -s, y: s, z: -s },
      { x: s, y: -s, z: -s },
    );
    points.push(
      { x: -s, y: -s, z: -s },
      { x: s, y: s, z: -s },
      { x: s, y: -s, z: s },
      { x: -s, y: s, z: s },
    );
    edges.push([0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]);
    edges.push([4, 5], [4, 6], [4, 7], [5, 6], [5, 7], [6, 7]);
  } else if (shapeType === "cylinders") {
    const r = Math.round(70 * length);
    const segments = 24;
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push({ x: Math.cos(theta) * r, y: Math.sin(theta) * r, z: -30 });
      points.push({ x: Math.cos(theta) * r, y: Math.sin(theta) * r, z: 30 });
      const next = (i + 1) % segments;
      edges.push([i * 2, next * 2], [i * 2 + 1, next * 2 + 1], [i * 2, i * 2 + 1]);
    }
    const offset = points.length;
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push({ x: Math.cos(theta) * r, y: -30, z: Math.sin(theta) * r });
      points.push({ x: Math.cos(theta) * r, y: 30, z: Math.sin(theta) * r });
      const next = (i + 1) % segments;
      edges.push(
        [offset + i * 2, offset + next * 2],
        [offset + i * 2 + 1, offset + next * 2 + 1],
        [offset + i * 2, offset + i * 2 + 1],
      );
    }
  } else {
    const t = (1.0 + Math.sqrt(5.0)) / 2.0;
    const s = Math.round(50 * length);
    const p = [
      [-1, t, 0],
      [1, t, 0],
      [-1, -t, 0],
      [1, -t, 0],
      [0, -1, t],
      [0, 1, t],
      [0, -1, -t],
      [0, 1, -t],
      [t, 0, -1],
      [t, 0, 1],
      [-t, 0, -1],
      [-t, 0, 1],
    ];
    p.forEach((v) => points.push({ x: v[0] * s, y: v[1] * s, z: v[2] * s }));
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const d = Math.hypot(
          points[i].x - points[j].x,
          points[i].y - points[j].y,
          points[i].z - points[j].z,
        );
        if (d < s * 2.1) edges.push([i, j]);
      }
    }
    p.forEach((v) => points.push({ x: v[0] * s * 0.5, y: v[1] * s * 0.5, z: v[2] * s * 0.5 }));
    const off = 12;
    for (let i = 0; i < 12; i++) {
      for (let j = i + 1; j < 12; j++) {
        const d = Math.hypot(
          points[off + i].x - points[off + j].x,
          points[off + i].y - points[off + j].y,
          points[off + i].z - points[off + j].z,
        );
        if (d < s * 1.1) edges.push([off + i, off + j]);
      }
      edges.push([i, off + i]);
    }
  }
  return { points, edges };
}

export function WireframeForm({
  variant = "cube",
  mode = "dark",
  speed = 1,
  size = 1,
  length = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  color,
  className,
}: WireframeFormProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isLight = mode === "light";
  const ink = color ?? (isLight ? "#1a1f2a" : "#ffffff");
  const live = useRef({ speed });
  live.current = { speed: clamp(speed, 0, 3) };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;

    const rgb = hexToRgb(ink);
    const lineAlpha = isLight ? 0.45 : 0.4;
    const lineWidth = Number((0.8 * clamp(size, 0.05, 200)).toFixed(2));
    const { points, edges } = buildShape(variant, clamp(length, 0.35, 2.5));
    let width = 1;
    let height = 1;
    let cx = 0;
    let cy = 0;
    let angleX = 0;
    let angleY = 0;
    let raf = 0;
    let visible = true;

    const project = (p: Point) => {
      const x = p.x * Math.cos(angleY) - p.z * Math.sin(angleY);
      let z = p.z * Math.cos(angleY) + p.x * Math.sin(angleY);
      const y = p.y * Math.cos(angleX) - z * Math.sin(angleX);
      z = z * Math.cos(angleX) + p.y * Math.sin(angleX);
      const fov = 400;
      const scale = fov / (fov + z);
      return { x: x * scale + cx, y: y * scale + cy, z };
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = lineWidth;
      const projected = points.map(project);
      edges.forEach((e) => {
        const p1 = projected[e[0]];
        const p2 = projected[e[1]];
        const depth = (p1.z + p2.z) / 2;
        const alpha = Math.max(0.1, 1 - depth / 200);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${rgb}, ${alpha * lineAlpha})`;
        ctx.stroke();
      });
      projected.forEach((p) => {
        const alpha = Math.max(0.1, 1 - p.z / 200);
        if (alpha > 0.5) {
          ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
          ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        }
      });
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      cx = width / 2;
      cy = height / 2;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    };

    const loop = () => {
      angleY += 0.005 * live.current.speed;
      angleX += 0.002 * live.current.speed;
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
  }, [variant, ink, isLight, size, length, prefersReducedMotion]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("relative aspect-square w-[480px] max-w-[72vw]", className)}
      style={{ opacity: clamp(opacity, 0.05, 1), filter }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
