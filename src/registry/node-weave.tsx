"use client";

// Ported from ThreeUI Community's Constellation Field (MIT, © 2026 Meng To).

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

export interface NodeWeaveProps {
  speed?: number;
  size?: number;
  length?: number;
  density?: number;
  strokeWidth?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Hub and link colour. Defaults to the theme's `--primary`. */
  color?: string;
  /** Scene background. Defaults to the theme's `--background`. */
  backgroundColor?: string;
  className?: string;
}

type Node = { x: number; y: number; vx: number; vy: number; radius: number; hub: boolean };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function NodeWeave({
  speed = 1,
  size = 1,
  length = 1,
  density = 1,
  strokeWidth = 0.75,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  color,
  backgroundColor,
  className,
}: NodeWeaveProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useTokens();
  const ink = color ?? tokens?.primary ?? "transparent";
  const thread = tokens?.muted ?? ink;
  const background = backgroundColor ?? "hsl(var(--background))";
  const paper = backgroundColor ?? tokens?.background ?? "transparent";
  const live = useRef({ speed, ink, thread, paper });
  live.current = { speed: clamp(speed, 0, 3), ink, thread, paper };
  const repaint = useRef<() => void>(() => {});

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;

    const LINK = Math.round(160 * clamp(length, 0.35, 2.5));
    const safeDensity = clamp(density, 0.25, 2.5);
    const nodeSize = clamp(size, 0.05, 200);
    const lineWidth = Number(Math.max(0.25, clamp(strokeWidth, 0.25, 8)).toFixed(2));
    let width = 1;
    let height = 1;
    let nodes: Node[] = [];
    const pointer = { x: -1000, y: -1000 };
    // Virtual clock so the node pulse follows `speed`, like the original's patched Date.now.
    let clock = 0;
    let last = performance.now();

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };

    const initNodes = () => {
      const max =
        width < 768
          ? Math.max(8, Math.round(40 * safeDensity))
          : Math.max(12, Math.round(85 * safeDensity));
      nodes = [];
      for (let i = 0; i < max; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: (Math.random() * 1.6 + 1.4) * nodeSize,
          hub: i % 6 === 0,
        });
      }
    };

    const draw = (advance: boolean) => {
      const { speed: s, ink: fill, thread, paper } = live.current;
      const now = performance.now();
      clock += (now - last) * (s || 1);
      last = now;
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";

      // Draw links first so nodes sit crisp on top.
      ctx.strokeStyle = thread;
      ctx.lineWidth = lineWidth;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < LINK) {
            const touchesHub = nodes[i].hub || nodes[j].hub;
            ctx.strokeStyle = touchesHub ? fill : thread;
            ctx.globalAlpha = (touchesHub ? 0.25 : 0.12) + (1 - d / LINK) * 0.45;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node) => {
        if (advance) {
          node.x += node.vx * (s || 1);
          node.y += node.vy * (s || 1);
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
          // Gentle pointer gravity.
          if (Math.hypot(node.x - pointer.x, node.y - pointer.y) < 220) {
            node.x -= (node.x - pointer.x) * 0.005;
            node.y -= (node.y - pointer.y) * 0.005;
          }
        }
        // Hubs are solid ink with a breathing ring; the rest are hollow knots on the weave.
        const pulse = 0.5 + Math.sin(clock * 0.0012 + node.x * 0.05) * 0.5;
        if (node.hub) {
          ctx.fillStyle = fill;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = fill;
          ctx.globalAlpha = 0.15 + pulse * 0.35;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * (2.6 + pulse * 1.4), 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = paper;
          ctx.strokeStyle = thread;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      pointer.x = inside ? x : -1000;
      pointer.y = inside ? y : -1000;
    };
    const onPointerLeave = () => {
      pointer.x = -1000;
      pointer.y = -1000;
    };

    let frame = 0;
    let visible = true;
    const tick = () => {
      draw(true);
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (prefersReducedMotion || frame || !visible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      initNodes();
      draw(false);
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    });
    const onVisibility = () => (document.hidden ? stop() : start());

    repaint.current = () => draw(false);
    resize();
    initNodes();
    draw(false);
    resizeObserver.observe(host);
    intersection.observe(host);
    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [prefersReducedMotion, size, length, density, strokeWidth]);

  // Repaint the still frame when the theme changes under it.
  useEffect(() => {
    repaint.current();
  }, [ink, thread, paper]);

  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);
  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background, filter }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ opacity: clamp(opacity, 0.05, 1) }}
      />
    </div>
  );
}
