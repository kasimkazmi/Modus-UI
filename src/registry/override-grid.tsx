"use client";
// Ported from ThreeUI Community's Override Grid (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type OverrideGridMode = "dark" | "light";

interface OverrideGridProps {
  mode?: OverrideGridMode;
  speed?: number;
  size?: number;
  gap?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

const PALETTES = {
  dark: { background: "#050505", block: "#f97316", alphaScale: 1 },
  light: { background: "#eef1f6", block: "#c2410c", alphaScale: 1.35 },
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function hexChannels(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.replace(/./g, "$&$&") : value;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export function OverrideGrid({
  mode = "dark",
  speed = 1,
  size = 48,
  gap = 2,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  color,
  backgroundColor,
  className,
}: OverrideGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const palette = PALETTES[mode === "light" ? "light" : "dark"];
  const options = useRef({ speed, size, gap, color, palette });
  options.current = { speed, size, gap, color, palette };

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
      const blockSize = Math.max(8, Math.round(clamp(o.size, 0.05, 200)));
      const blockGap = Math.max(0, Math.round(clamp(o.gap, 0, 64)));
      const channels = hexChannels(o.color ?? o.palette.block);

      ctx.clearRect(0, 0, width, height);
      const pitch = blockSize + blockGap;
      const cols = Math.ceil(width / pitch);
      const rows = Math.ceil(height / pitch);
      const centerX = cols / 2;
      const centerY = rows / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const dist = Math.sqrt(Math.pow(i - centerX, 2) + Math.pow(j - centerY, 2));
          const wave = Math.sin(time - dist * 0.4);
          if (wave > 0) {
            const alpha = wave * 0.15;
            ctx.fillStyle = `rgba(${channels}, ${alpha * o.palette.alphaScale})`;
            // Block scaling for "Z-depth" pulsing feel
            const scale = wave * 0.7 + 0.3;
            const blockScaled = blockSize * scale;
            const offset = (pitch - blockScaled) / 2;
            ctx.fillRect(i * pitch + offset, j * pitch + offset, blockScaled, blockScaled);
          }
        }
      }
    };

    const tick = () => {
      time += 0.04 * clamp(options.current.speed, 0, 3);
      draw();
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!prefersReducedMotion && visible && !document.hidden && !frame)
        frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      width = canvas.width = host.offsetWidth;
      height = canvas.height = host.offsetHeight;
      if (prefersReducedMotion) time = 1;
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
