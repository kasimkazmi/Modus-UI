"use client";

// Ported from ThreeUI Community's Data Pixel Arc (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tokens = {
  primary: string;
  foreground: string;
  muted: string;
  background: string;
  card: string;
  border: string;
  dark: boolean;
};

/** Reads the Modus theme tokens (bare HSL channels) as comma `hsl()` strings canvas and three.js both parse. */
function readTokens(): Tokens {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const hsl = (name: string) =>
    `hsl(${cs
      .getPropertyValue(name)
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .join(", ")})`;
  return {
    primary: hsl("--primary"),
    foreground: hsl("--foreground"),
    muted: hsl("--muted-foreground"),
    background: hsl("--background"),
    card: hsl("--card"),
    border: hsl("--border"),
    dark: root.classList.contains("dark") || root.dataset.theme === "dark",
  };
}

/** The current theme tokens, re-read whenever the mode or palette on <html> changes. */
function useTokens() {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  useEffect(() => {
    const update = () => setTokens(readTokens());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return tokens;
}

export interface MosaicCrestProps {
  speed?: number;
  pixelSize?: number;
  arcCenter?: number;
  arcDrop?: number;
  thickness?: number;
  brightness?: number;
  hue?: number;
  saturation?: number;
  /** Scene background. Defaults to the theme's `--background`. */
  backgroundColor?: string;
  className?: string;
}

export function MosaicCrest({
  speed = 1,
  pixelSize = 12,
  arcCenter = 0.82,
  arcDrop = -0.72,
  thickness = 0.24,
  brightness = 1,
  hue = 0,
  saturation = 1,
  backgroundColor,
  className,
}: MosaicCrestProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useTokens();
  const paper = backgroundColor ?? tokens?.background;
  const ink = tokens?.primary;
  const edge = tokens?.muted;
  const options = useRef({
    speed,
    pixelSize,
    arcCenter,
    arcDrop,
    thickness,
    brightness,
    paper,
    ink,
    edge,
  });
  const repaint = useRef<() => void>(() => {});
  options.current = {
    speed,
    pixelSize,
    arcCenter,
    arcDrop,
    thickness,
    brightness,
    paper,
    ink,
    edge,
  };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!host || !canvas || !context) return;

    let width = 1;
    let height = 1;
    let time = 0;

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const render = () => {
      const o = options.current;
      if (!o.paper || !o.ink || !o.edge) return;
      context.globalAlpha = 1;
      context.fillStyle = o.paper;
      context.fillRect(0, 0, width, height);
      const cols = Math.ceil(width / o.pixelSize);
      const rows = Math.ceil(height / o.pixelSize);
      const arcCenterY = height * o.arcCenter;
      const drop = height * o.arcDrop;
      const band = height * o.thickness;
      const gap = Math.max(1, Math.round(o.pixelSize * 0.18));
      for (let x = 0; x < cols; x += 1) {
        for (let y = 0; y < rows; y += 1) {
          const px = x * o.pixelSize;
          const py = y * o.pixelSize;
          const nx = (px / width) * 2 - 1;
          const curveY = arcCenterY + Math.pow(Math.abs(nx), 1.8) * drop;
          let intensity = Math.max(0, 1 - Math.abs(py - curveY) / band);
          if (intensity <= 0.01) continue;
          const wave1 = Math.sin(nx * 4 - time * 1.5) * 0.1;
          const wave2 = Math.cos(py * 0.01 + time) * 0.1;
          intensity = Math.max(0, Math.min(1, intensity + wave1 + wave2));
          intensity *= Math.max(0, 1 - Math.pow(Math.abs(nx), 2.5));
          if (intensity <= 0.02) continue;
          const size = o.pixelSize - gap;
          // Muted tesserae make the band; the crest is laid in the primary colour on top.
          context.fillStyle = o.edge;
          context.globalAlpha = Math.min(1, Math.pow(intensity, 0.8) * 0.55 * o.brightness);
          context.fillRect(px, py, size, size);
          const core = Math.pow(intensity, 2.6);
          if (core > 0.04) {
            context.fillStyle = o.ink;
            context.globalAlpha = Math.min(1, core * o.brightness);
            context.fillRect(px, py, size, size);
          }
        }
      }
      context.globalAlpha = 1;
      time += 0.02 * o.speed;
    };

    let frame = 0;
    let visible = true;
    const tick = () => {
      render();
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (prefersReducedMotion || frame || !visible || document.hidden) return;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      render();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    });
    const onVisibility = () => (document.hidden ? stop() : start());

    repaint.current = render;
    resize();
    render();
    resizeObserver.observe(host);
    intersection.observe(host);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [prefersReducedMotion]);

  // Repaint the still frame when the theme changes under it.
  useEffect(() => {
    repaint.current();
  }, [paper, ink, edge]);

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor ?? "hsl(var(--background))" }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ filter: `hue-rotate(${hue}deg) saturate(${saturation})` }}
      />
    </div>
  );
}
