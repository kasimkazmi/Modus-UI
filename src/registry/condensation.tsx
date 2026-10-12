"use client";

// Ported from ThreeUI Community's Condensation (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CondensationProps {
  speed?: number;
  dropAmount?: number;
  opacity?: number;
  dropColor?: string;
  edgeColor?: string;
  highlightColor?: string;
  splashColor?: string;
  backgroundColor?: string;
  className?: string;
}

type Drop = {
  x: number;
  y: number;
  r: number;
  rMax: number;
  grow: number;
  running: boolean;
  vy: number;
};

type Splash = { x: number; y: number; r0: number; born: number };

const hexRgb = (hex: string) => {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

export function Condensation({
  speed = 1,
  dropAmount = 1,
  opacity = 1,
  dropColor = "#608bc4",
  edgeColor = "#466294",
  highlightColor = "#ffffff",
  splashColor = "#4b6c9e",
  backgroundColor = "#050507",
  className,
}: CondensationProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({ speed, dropAmount });
  options.current = { speed, dropAmount };
  const colors = `${dropColor}|${edgeColor}|${highlightColor}|${splashColor}`;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let floorY = 1;
    let baseMaxDrops = 120;
    let lastCascade = 0;
    let now = 0;
    let last = 0;
    let drops: Drop[] = [];
    let splashes: Splash[] = [];
    const [dropRgb, edgeRgb, shineRgb, splashRgb] = colors.split("|").map(hexRgb);
    const sprites = new Map<number, HTMLCanvasElement>();

    const sprite = (radius: number) => {
      const key = Math.max(0.5, Math.round(radius * 2) / 2);
      const cached = sprites.get(key);
      if (cached) return cached;
      const padding = Math.ceil(2 * dpr);
      const size = Math.ceil(key * 2 + padding * 2);
      const element = document.createElement("canvas");
      element.width = size;
      element.height = size;
      const c = element.getContext("2d");
      if (!c) return element;
      const center = size / 2;
      const lit = key / (4.4 * dpr);
      c.fillStyle = `rgba(${dropRgb},${0.18 + lit * 0.22})`;
      c.beginPath();
      c.arc(center, center, key, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = `rgba(${edgeRgb},${0.35 + lit * 0.35})`;
      c.lineWidth = 0.9 * dpr;
      c.stroke();
      c.fillStyle = `rgba(${shineRgb},${0.32 + lit * 0.3})`;
      c.beginPath();
      c.arc(
        center - key * 0.32,
        center - key * 0.36,
        Math.max(0.45 * dpr, key * 0.24),
        0,
        Math.PI * 2,
      );
      c.fill();
      sprites.set(key, element);
      return element;
    };

    const maxDrops = () => Math.round(baseMaxDrops * options.current.dropAmount);

    const seedDrop = (headStart = 0) => {
      const margin = 8 * dpr;
      drops.push({
        x: margin + Math.random() * Math.max(1, width - margin * 2),
        y: margin + Math.random() * Math.max(1, floorY - margin * 2),
        r: (0.5 + headStart * 0.7) * dpr,
        rMax: (2.1 + Math.random() * 2.3) * dpr,
        grow: (0.0022 + Math.random() * 0.0032) * dpr,
        running: false,
        vy: 0,
      });
    };

    const step = (motion: number) => {
      if (drops.length < maxDrops() && Math.random() < 0.34 * motion) seedDrop();
      if (now - lastCascade > 6400) {
        lastCascade = now;
        drops
          .filter((drop) => !drop.running)
          .sort((a, b) => b.r - a.r)
          .slice(0, 3)
          .forEach((drop) => {
            drop.running = true;
            drop.vy = 0.35 * dpr;
          });
      }
      for (let index = drops.length - 1; index >= 0; index--) {
        const drop = drops[index];
        if (!drop.running) {
          drop.r += drop.grow * motion;
          if (drop.r >= drop.rMax) {
            drop.running = true;
            drop.vy = 0.3 * dpr;
          }
          continue;
        }
        drop.vy = Math.min(drop.vy + 0.075 * dpr * motion, 5.4 * dpr);
        drop.y += drop.vy * motion;
        // Running drops swallow the still ones in their path.
        for (let other = drops.length - 1; other >= 0; other--) {
          const o = drops[other];
          if (o === drop || o.running) continue;
          const overlapsX = Math.abs(o.x - drop.x) < drop.r + o.r + 1.5 * dpr;
          const overlapsY = o.y > drop.y - drop.r && o.y < drop.y + drop.vy + drop.r;
          if (overlapsX && overlapsY) {
            drop.r = Math.sqrt(drop.r * drop.r + o.r * o.r);
            drops.splice(other, 1);
            if (other < index) index--;
          }
        }
        if (drop.y >= floorY) {
          splashes.push({ x: drop.x, y: floorY, r0: drop.r, born: now });
          drops.splice(index, 1);
        }
      }
      splashes = splashes.filter((splash) => now - splash.born < 760);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      drops.forEach((drop) => {
        const image = sprite(drop.r);
        ctx.drawImage(image, drop.x - image.width / 2, drop.y - image.height / 2);
      });
      splashes.forEach((splash) => {
        const progress = (now - splash.born) / 760;
        if (progress < 0 || progress > 1) return;
        const radius = splash.r0 + progress * 16 * dpr;
        ctx.lineWidth = 1.1 * dpr;
        ctx.strokeStyle = `rgba(${splashRgb},${(1 - progress) * 0.52})`;
        ctx.beginPath();
        ctx.ellipse(splash.x, splash.y, radius, radius * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      height = canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      floorY = Math.max(1, height - 2 * dpr);
      baseMaxDrops = Math.max(80, Math.min(240, Math.round((width * height) / (dpr * dpr) / 5200)));
      drops = [];
      splashes = [];
      sprites.clear();
      const seedCount = Math.round(maxDrops() * 0.62);
      for (let i = 0; i < seedCount; i++) seedDrop(Math.random() * 3);
      render();
    };

    let frame = 0;
    let visible = true;
    const tick = (time: number) => {
      const delta = last ? Math.min(50, time - last) : 16.67;
      last = time;
      now += delta * options.current.speed;
      step(options.current.speed);
      render();
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (prefersReducedMotion || frame) return;
      last = 0;
      frame = requestAnimationFrame(tick);
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
    const onVisibility = () => !document.hidden && visible && start();
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
      drops = [];
      splashes = [];
      sprites.clear();
    };
  }, [prefersReducedMotion, colors]);

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background: backgroundColor }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" style={{ opacity }} />
    </div>
  );
}
