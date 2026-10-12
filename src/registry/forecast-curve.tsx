"use client";

// Ported from ThreeUI Community's Predictive Arc (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const readToken = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export interface ForecastCurveProps {
  speed?: number;
  spacing?: number;
  dotSize?: number;
  archHeight?: number;
  thickness?: number;
  brightness?: number;
  hue?: number;
  saturation?: number;
  backgroundColor?: string;
  className?: string;
}

export function ForecastCurve({
  speed = 1,
  spacing = 7,
  dotSize = 5,
  archHeight = 0.5,
  thickness = 1,
  brightness = 1,
  hue = 0,
  saturation = 1,
  backgroundColor,
  className,
}: ForecastCurveProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({
    speed,
    spacing,
    dotSize,
    archHeight,
    thickness,
    brightness,
    backgroundColor,
  });
  options.current = {
    speed,
    spacing,
    dotSize,
    archHeight,
    thickness,
    brightness,
    backgroundColor,
  };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!host || !canvas || !context) return;

    let width = 1;
    let height = 1;
    let time = 0;
    let background = "";
    let accent = "";
    let ink = "";
    let isLight = true;
    const readTheme = () => {
      background = readToken("--background");
      accent = readToken("--primary");
      ink = readToken("--muted-foreground");
      isLight = Number.parseFloat(background.split(/\s+/)[2] ?? "100") > 50;
    };
    readTheme();

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
      context.fillStyle = o.backgroundColor ?? `hsl(${background})`;
      context.fillRect(0, 0, width, height);
      time += 0.015 * o.speed;

      const centerX = width / 2;
      // A rising curve: low in the middle, lifting toward both edges.
      const archPeakY = height * 0.72;
      const archWidth = width * 1.5;
      const archHeight = height * o.archHeight;
      context.globalCompositeOperation = isLight ? "source-over" : "lighter";

      for (let x = 0; x < width; x += o.spacing) {
        const normX = (x - centerX) / (archWidth / 2);
        const curveY = archPeakY - normX * normX * archHeight;
        for (let y = 0; y < height; y += o.spacing) {
          const distanceToCurve = Math.abs(y - curveY);
          const band = (90 + (1 - Math.abs(normX)) * 60) * o.thickness;
          if (distanceToCurve >= band) continue;
          let intensity = 1 - distanceToCurve / band;
          const waveX = Math.sin(x * 0.015 + time);
          const waveY = Math.cos(y * 0.02 + time);
          intensity = intensity * 0.7 + waveX * waveY * 0.3 * intensity;
          intensity *= Math.max(0, 1 - Math.pow(Math.abs(normX), 2.5));
          if (intensity <= 0.02) continue;

          // Cores take the accent; the band's edges stay in muted ink.
          const alpha = Math.min(1, intensity * o.brightness);
          context.fillStyle = `hsl(${intensity > 0.6 ? accent : ink} / ${alpha.toFixed(2)})`;
          context.fillRect(x, y, o.dotSize * intensity, o.dotSize * intensity);
        }
      }
      context.globalCompositeOperation = "source-over";
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

    resize();
    render();
    resizeObserver.observe(host);
    intersection.observe(host);
    document.addEventListener("visibilitychange", onVisibility);
    start();
    const themeObserver = new MutationObserver(() => {
      readTheme();
      render();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "data-palette"],
    });

    return () => {
      stop();
      themeObserver.disconnect();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [prefersReducedMotion]);

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
