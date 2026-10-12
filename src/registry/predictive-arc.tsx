"use client";

// Ported from ThreeUI Community's Predictive Arc (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PredictiveArcProps {
  mode?: "dark" | "light";
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

export function PredictiveArc({
  mode = "dark",
  speed = 1,
  spacing = 5,
  dotSize = 6,
  archHeight = 0.7,
  thickness = 1,
  brightness = 1,
  hue = 0,
  saturation = 1,
  backgroundColor,
  className,
}: PredictiveArcProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({
    mode,
    speed,
    spacing,
    dotSize,
    archHeight,
    thickness,
    brightness,
    backgroundColor,
  });
  options.current = {
    mode,
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
      const isLight = o.mode === "light";
      context.fillStyle = o.backgroundColor ?? (isLight ? "#eef1f6" : "#030303");
      context.fillRect(0, 0, width, height);
      time += 0.015 * o.speed;

      const centerX = width / 2;
      const archPeakY = height * 0.35;
      const archWidth = width * 1.5;
      const archHeight = height * o.archHeight;
      context.globalCompositeOperation = isLight ? "source-over" : "lighter";

      for (let x = 0; x < width; x += o.spacing) {
        const normX = (x - centerX) / (archWidth / 2);
        const curveY = archPeakY + normX * normX * archHeight;
        for (let y = 0; y < height; y += o.spacing) {
          const distanceToCurve = Math.abs(y - curveY);
          const band = (140 + (1 - Math.abs(normX)) * 80) * o.thickness;
          if (distanceToCurve >= band) continue;
          let intensity = 1 - distanceToCurve / band;
          const waveX = Math.sin(x * 0.015 + time);
          const waveY = Math.cos(y * 0.02 + time);
          intensity = intensity * 0.7 + waveX * waveY * 0.3 * intensity;
          intensity *= Math.max(0, 1 - Math.pow(Math.abs(normX), 2.5));
          if (intensity <= 0.02) continue;

          let r: number;
          let g: number;
          let b: number;
          if (isLight) {
            // Cool violet ink on pale paper, readable without additive washout.
            r = Math.min(255, 48 * intensity + 70 * Math.pow(intensity, 3));
            g = Math.min(255, 28 * intensity + 45 * Math.pow(intensity, 4));
            b = Math.min(255, 120 * intensity + 110 * Math.pow(intensity, 2));
            if (intensity > 0.7) {
              const coreBoost = (intensity - 0.7) * 3.3;
              r = Math.min(255, r + 90 * coreBoost);
              g = Math.min(255, g + 70 * coreBoost);
              b = Math.min(255, b + 110 * coreBoost);
            }
          } else {
            r = Math.min(255, 60 * intensity + 100 * Math.pow(intensity, 3));
            g = Math.min(255, 20 * intensity + 60 * Math.pow(intensity, 4));
            b = Math.min(255, 120 * intensity + 135 * Math.pow(intensity, 2));
            if (intensity > 0.7) {
              const coreBoost = (intensity - 0.7) * 3.3;
              r = Math.min(255, r + 150 * coreBoost);
              g = Math.min(255, g + 150 * coreBoost);
              b = Math.min(255, b + 150 * coreBoost);
            }
          }
          context.fillStyle = `rgb(${Math.floor(r * o.brightness)}, ${Math.floor(g * o.brightness)}, ${Math.floor(b * o.brightness)})`;
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

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor ?? (mode === "light" ? "#f3f6f1" : "#030304") }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ filter: `hue-rotate(${hue}deg) saturate(${saturation})` }}
      />
    </div>
  );
}
