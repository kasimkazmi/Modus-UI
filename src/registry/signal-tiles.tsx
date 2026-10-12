"use client";
// Ported from ThreeUI Community's Override Grid (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SignalTilesProps {
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A bare-HSL theme token (`"24 9% 10%"`) read from the document root. */
const readToken = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function SignalTiles({
  speed = 1,
  size = 28,
  gap = 6,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  color,
  backgroundColor,
  className,
}: SignalTilesProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({ speed, size, gap, color });
  options.current = { speed, size, gap, color };

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
    let ink = "";
    let accent = "";
    const readTheme = () => {
      ink = readToken("--muted-foreground");
      accent = readToken("--primary");
    };

    const draw = () => {
      const o = options.current;
      const blockSize = Math.max(8, Math.round(clamp(o.size, 0.05, 200)));
      const blockGap = Math.max(0, Math.round(clamp(o.gap, 0, 64)));

      ctx.clearRect(0, 0, width, height);
      const pitch = blockSize + blockGap;
      const cols = Math.ceil(width / pitch);
      const rows = Math.ceil(height / pitch);
      // The wave rolls in from the lower-left corner rather than the centre.
      const originX = -cols * 0.1;
      const originY = rows * 1.1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const dist = Math.hypot(i - originX, j - originY);
          const wave = Math.sin(time - dist * 0.4);
          if (wave > 0) {
            // Crests take the accent; the shoulders of each wave stay in muted ink.
            const crest = wave > 0.82;
            const alpha = crest ? 0.55 + wave * 0.35 : wave * 0.28;
            ctx.fillStyle = o.color ?? `hsl(${crest ? accent : ink} / ${alpha})`;
            if (o.color) ctx.globalAlpha = alpha;
            const scale = wave * 0.65 + 0.35;
            const blockScaled = blockSize * scale;
            const offset = (pitch - blockScaled) / 2;
            ctx.beginPath();
            ctx.roundRect(
              i * pitch + offset,
              j * pitch + offset,
              blockScaled,
              blockScaled,
              blockScaled * 0.28,
            );
            ctx.fill();
            ctx.globalAlpha = 1;
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
    const themeObserver = new MutationObserver(() => {
      readTheme();
      draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "data-palette"],
    });
    readTheme();
    resize();
    start();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
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
      style={{ background: backgroundColor ?? "hsl(var(--background))", filter }}
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
