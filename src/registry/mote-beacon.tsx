"use client";
// Ported from ThreeUI Community's Particle Drift (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MoteBeaconProps {
  className?: string;
  speed?: number;
  size?: number;
  length?: number;
  density?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  backgroundColor?: string;
}

// Editorial marks rather than terminal characters.
const CHARS = "abcdefghmnorstuwxyz&§¶†‡*+·~".split("");
const root = () => getComputedStyle(document.documentElement);
const hsl = (channels: string, alpha = 1) => `hsl(${channels} / ${alpha})`;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const scaleCount = (base: number, density: number, minimum: number) =>
  Math.max(minimum, Math.round(base * density));

export function MoteBeacon({
  className,
  speed = 1,
  size = 1,
  length = 1,
  density = 0.8,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  backgroundColor,
}: MoteBeaconProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 3);

  const [themeKey, setThemeKey] = useState(0);
  const safeSize = clamp(size, 0.05, 200);
  const safeLength = clamp(length, 0.35, 2.5);
  const safeDensity = clamp(density, 0.25, 2.5);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;

    const link = Math.round(120 * safeLength);
    const proximityAlpha = 0.2;
    const primary = root().getPropertyValue("--primary").trim();
    const muted = root().getPropertyValue("--muted-foreground").trim();
    const activeFill = hsl(primary);
    const idleFill = hsl(muted, 0.6);
    const fontFamily = root().getPropertyValue("--font-heading").trim() || "Georgia, serif";

    let width = 0;
    let height = 0;
    let nodes: { x: number; y: number; vy: number; char: string }[] = [];
    let beams: {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
    }[] = [];
    const mouse = { x: -1000, y: -1000 };

    const initParticles = () => {
      nodes = Array.from({ length: scaleCount(90, safeDensity, 12) }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vy: Math.random() * 0.4 + 0.1,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
      }));
      beams = Array.from({ length: scaleCount(25, safeDensity, 4) }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        length: (Math.random() * 100 + 50) * safeLength,
        speed: Math.random() * 6 + 3,
        opacity: Math.random() * 0.5 + 0.3,
      }));
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    const draw = (animate: boolean) => {
      const s = animate ? speedRef.current : 0;
      ctx.clearRect(0, 0, width, height);

      beams.forEach((b) => {
        b.y -= b.speed * s;
        if (b.y + b.length < 0) {
          b.y = height + 100;
          b.x = Math.random() * width;
        }
        const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.length);
        g.addColorStop(0, hsl(primary, b.opacity));
        g.addColorStop(1, "transparent");
        ctx.strokeStyle = g;
        ctx.lineWidth = Number((1.5 * safeSize).toFixed(2));
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x, b.y + b.length);
        ctx.stroke();
      });

      ctx.font = `italic 15px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const d = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          if (d < link) {
            ctx.strokeStyle = hsl(muted, proximityAlpha * (1 - d / link));
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        n.y += n.vy * s;
        if (n.y > height + 20) {
          n.y = -20;
          n.x = Math.random() * width;
        }
        const dist = Math.hypot(mouse.x - n.x, mouse.y - n.y);
        if (animate && (dist < 180 || Math.random() > 0.98))
          n.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        if (dist < 180) {
          ctx.strokeStyle = hsl(primary, 0.5 * (1 - dist / 180));
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
        ctx.fillStyle = dist < 180 ? activeFill : idleFill;
        ctx.fillText(n.char, n.x, n.y);
      });
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    let raf = 0;
    let inView = true;
    const loop = () => {
      draw(true);
      raf = requestAnimationFrame(loop);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (prefersReducedMotion) draw(false);
      else if (inView && !document.hidden) raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) draw(false);
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(host);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pointermove", onMove);
    sync();
    const themeObserver = new MutationObserver(() => setThemeKey((key) => key + 1));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "data-palette"],
    });

    return () => {
      themeObserver.disconnect();
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onMove);
    };
  }, [themeKey, safeSize, safeLength, safeDensity, prefersReducedMotion]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        background: backgroundColor ?? "hsl(var(--background))",
        filter,
      }}
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
