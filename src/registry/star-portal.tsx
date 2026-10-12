"use client";
// Ported from ThreeUI Community's Imaginie Star Portal (MIT, © 2026 Meng To).

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StarPortalProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  label?: string;
  mode?: "light" | "dark";
  hue?: number;
  saturation?: number;
  brightness?: number;
  starColors?: string[];
  className?: string;
}

const DEFAULT_STAR_COLORS = [
  "rgba(230, 194, 158, ",
  "rgba(244, 244, 246, ",
  "rgba(173, 140, 255, ",
  "rgba(135, 206, 250, ",
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function StarPortal({
  label = "Begin the journey",
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  starColors = DEFAULT_STAR_COLORS,
  className,
  onClick,
  href = "#",
  ...props
}: StarPortalProps) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const portalRef = React.useRef<HTMLCanvasElement>(null);
  const ambientRef = React.useRef<HTMLCanvasElement>(null);
  const colorsKey = starColors.join("|");

  React.useEffect(() => {
    const root = rootRef.current;
    const portalCanvas = portalRef.current;
    const ambientCanvas = ambientRef.current;
    if (!root || !portalCanvas || !ambientCanvas) return;
    const ctxPortal = portalCanvas.getContext("2d");
    const ctxAmbient = ambientCanvas.getContext("2d");
    if (!ctxPortal || !ctxAmbient) return;
    const colors = colorsKey.split("|");

    type Star = {
      x: number;
      y: number;
      radius: number;
      color: string;
      speed: number;
      angle: number;
      pulse: number;
    };
    type AmbientStar = {
      x: number;
      y: number;
      size: number;
      opacity: number;
      drift: number;
    };
    let stars: Star[] = [];
    let ambientStars: AmbientStar[] = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      portalCanvas.width = width;
      portalCanvas.height = height;
      ambientCanvas.width = width;
      ambientCanvas.height = height;
      stars = [];
      for (let i = 0; i < 45; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: Math.random() * 0.15 + 0.05,
          angle: Math.random() * Math.PI * 2,
          pulse: Math.random() * 0.02,
        });
      }
      ambientStars = [];
      for (let i = 0; i < 70; i++) {
        ambientStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 0.8 + 0.2,
          opacity: Math.random() * 0.6 + 0.1,
          drift: Math.random() * 0.02 + 0.01,
        });
      }
    };

    const draw = (move: boolean) => {
      ctxPortal.clearRect(0, 0, width, height);
      stars.forEach((s) => {
        if (move) {
          s.x += Math.cos(s.angle) * s.speed;
          s.y += Math.sin(s.angle) * s.speed;
          if (s.x < 0 || s.x > width) s.angle = Math.PI - s.angle;
          if (s.y < 0 || s.y > height) s.angle = -s.angle;
          s.speed += (Math.random() - 0.5) * 0.01;
          s.speed = Math.max(0.02, Math.min(s.speed, 0.25));
        }
        const alpha = 0.3 + Math.abs(Math.sin(Date.now() * s.pulse)) * 0.7;
        ctxPortal.beginPath();
        ctxPortal.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctxPortal.fillStyle = s.color + alpha + ")";
        ctxPortal.shadowBlur = s.radius * 4;
        ctxPortal.shadowColor = s.color + "0.8)";
        ctxPortal.fill();
      });
      ctxAmbient.clearRect(0, 0, width, height);
      ambientStars.forEach((s) => {
        if (move) {
          s.y -= s.drift;
          if (s.y < 0) s.y = height;
        }
        ctxAmbient.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctxAmbient.fillRect(s.x, s.y, s.size, s.size);
      });
    };

    resize();
    draw(false);

    let raf = 0;
    let visible = true;
    const loop = () => {
      draw(true);
      raf = requestAnimationFrame(loop);
    };
    const update = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (!prefersReducedMotion && visible && !document.hidden) {
        raf = requestAnimationFrame(loop);
      }
    };
    const ro = new ResizeObserver(() => {
      resize();
      draw(false);
    });
    ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [prefersReducedMotion, colorsKey]);

  const isLight = mode === "light";
  const h = clamp(hue, -180, 180);
  const sat = clamp(saturation, 0, 2);
  const bri = clamp(brightness, 0.35, 1.65);
  const filter =
    h === 0 && sat === 1 && bri === 1
      ? undefined
      : `hue-rotate(${h}deg) saturate(${sat}) brightness(${bri})`;
  const canvasFilter = isLight
    ? "invert(1) hue-rotate(180deg) saturate(.92) brightness(1.02)"
    : undefined;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex h-full min-h-[inherit] w-full items-center justify-center overflow-hidden",
        className,
      )}
      style={{
        background: isLight ? "#f4f7fb" : "#0d0a12",
        colorScheme: mode,
        filter,
      }}
    >
      <canvas
        ref={ambientRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        style={{ filter: canvasFilter }}
      />
      <canvas
        ref={portalRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full mix-blend-screen"
        style={{ filter: canvasFilter }}
      />
      <a
        href={href}
        onClick={(event) => {
          if (href === "#") event.preventDefault();
          onClick?.(event);
        }}
        className="relative z-[2] flex items-center gap-1.5 rounded-full px-6 py-3 text-[13px] font-semibold text-[#0d0a12] antialiased shadow-[0_0_20px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-[400ms] ease-[ease] hover:shadow-[0_0_30px_rgba(255,220,180,0.35),inset_0_1px_0_rgba(255,255,255,0.8)]"
        style={{
          fontFamily: "'Inter', sans-serif",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,220,205,0.9) 50%, rgba(220,240,255,0.9) 100%)",
        }}
        {...props}
      >
        {label}
        <svg aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" className="text-base">
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M4 12h16m0 0l-6-6m6 6l-6 6"
          />
        </svg>
      </a>
    </div>
  );
}
