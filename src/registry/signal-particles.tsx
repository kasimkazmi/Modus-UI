"use client";
// Ported from ThreeUI Community's Signal Particles (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type SignalParticlesMode = "dark" | "light";

interface SignalParticlesProps {
  mode?: SignalParticlesMode;
  speed?: number;
  size?: number;
  length?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  dotColor?: string;
  highlightColors?: [string, string];
  backgroundColor?: string;
  className?: string;
}

const PALETTES = {
  dark: { background: "#0a0a0a", dot: "#94a3b8", highlights: ["#3b82f6", "#8b5cf6"] },
  light: { background: "#eef1f6", dot: "#243044", highlights: ["#1d4ed8", "#5b21b6"] },
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function hexChannels(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.replace(/./g, "$&$&") : value;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export function SignalParticles({
  mode = "dark",
  speed = 1,
  size = 1,
  length = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  dotColor,
  highlightColors,
  backgroundColor,
  className,
}: SignalParticlesProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const palette = PALETTES[mode === "light" ? "light" : "dark"];
  const options = useRef({ speed, size, length, dotColor, highlightColors, palette });
  options.current = { speed, size, length, dotColor, highlightColors, palette };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let time = 0;
    let frame = 0;
    let visible = true;

    const draw = () => {
      const o = options.current;
      const spacing = Math.max(6, Math.round(16 / Math.max(0.35, clamp(o.length, 0.35, 2.5))));
      const dotRadius = Number((1.5 * clamp(o.size, 0.05, 200)).toFixed(2));
      const dot = hexChannels(o.dotColor ?? o.palette.dot);
      const [blue, purple] = o.highlightColors ?? o.palette.highlights;

      ctx.clearRect(0, 0, width, height);
      const cols = Math.floor(width / spacing);
      const rows = Math.floor(height / spacing);
      const offsetX = (width - cols * spacing) / 2;
      const offsetY = (height - rows * spacing) / 2;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = offsetX + i * spacing;
          const y = offsetY + j * spacing;
          const nx = i * 0.1;
          const ny = j * 0.1;
          const wave1 = Math.sin(nx + time * 0.5) * Math.cos(ny - time * 0.3);
          const wave2 = Math.sin(nx * 0.5 - ny * 0.5 + time * 0.8);
          const value = wave1 + wave2;

          if (value > 0.1) {
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            const highlightCheck = Math.sin(i * 12.34) * Math.cos(j * 56.78);
            if (highlightCheck > 0.98) {
              ctx.fillStyle = blue;
            } else if (highlightCheck < -0.98) {
              ctx.fillStyle = purple;
            } else {
              const alpha = Math.min(0.6, (value - 0.1) * 0.8);
              ctx.fillStyle = `rgba(${dot}, ${alpha})`;
            }
            ctx.fill();
          }
        }
      }
    };

    const tick = () => {
      draw();
      time += 0.02 * clamp(options.current.speed, 0, 3);
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!prefersReducedMotion && visible && !document.hidden && !frame)
        frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      width = canvas.width = host.offsetWidth;
      height = canvas.height = host.offsetHeight;
      draw();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    const onVisibility = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVisibility);
    resizeObserver.observe(host);
    intersection.observe(host);
    resize();
    start();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [prefersReducedMotion]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background: backgroundColor ?? palette.background, filter }}
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
