"use client";

// Ported from ThreeUI Community's Data Pixel Arc (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DataPixelArcProps {
  mode?: "dark" | "light";
  speed?: number;
  pixelSize?: number;
  arcCenter?: number;
  arcDrop?: number;
  thickness?: number;
  brightness?: number;
  hue?: number;
  saturation?: number;
  backgroundColor?: string;
  className?: string;
}

export function DataPixelArc({
  mode = "dark",
  speed = 1,
  pixelSize = 8,
  arcCenter = 0.4,
  arcDrop = 0.9,
  thickness = 0.35,
  brightness = 1,
  hue = 0,
  saturation = 1,
  backgroundColor,
  className,
}: DataPixelArcProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({
    mode,
    speed,
    pixelSize,
    arcCenter,
    arcDrop,
    thickness,
    brightness,
    backgroundColor,
  });
  options.current = {
    mode,
    speed,
    pixelSize,
    arcCenter,
    arcDrop,
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
    let lightBackground: CanvasGradient | null = null;

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      lightBackground = context.createLinearGradient(0, 0, 0, height);
      lightBackground.addColorStop(0, "#f8faf6");
      lightBackground.addColorStop(0.58, "#f3f6f1");
      lightBackground.addColorStop(1, "#edf1ec");
    };

    const render = () => {
      const o = options.current;
      const isLight = o.mode === "light";
      context.fillStyle =
        o.backgroundColor ?? (isLight && lightBackground ? lightBackground : "#030308");
      context.fillRect(0, 0, width, height);
      const cols = Math.ceil(width / o.pixelSize);
      const rows = Math.ceil(height / o.pixelSize);
      const arcCenterY = height * o.arcCenter;
      const drop = height * o.arcDrop;
      const band = height * o.thickness;
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
          const coreStrength = Math.pow(intensity, 3);
          const middleStrength = Math.pow(intensity, 1.5);
          let r: number;
          let g: number;
          let b: number;
          if (isLight) {
            // Sage edge pixels hold their shape on paper while the emerald core stays vivid.
            const pigment = Math.pow(intensity, 0.78);
            const inkStrength = Math.max(0.45, Math.min(1.35, o.brightness));
            const paper = [238, 242, 237];
            const ink = [
              192 - 172 * pigment - 10 * coreStrength,
              204 - 88 * pigment + 18 * coreStrength,
              193 - 132 * pigment + 4 * coreStrength,
            ];
            r = Math.max(
              0,
              Math.min(255, Math.round(paper[0] + (ink[0] - paper[0]) * inkStrength)),
            );
            g = Math.max(
              0,
              Math.min(255, Math.round(paper[1] + (ink[1] - paper[1]) * inkStrength)),
            );
            b = Math.max(
              0,
              Math.min(255, Math.round(paper[2] + (ink[2] - paper[2]) * inkStrength)),
            );
          } else {
            r = Math.floor((30 * intensity + 100 * coreStrength) * o.brightness);
            g = Math.floor((220 * middleStrength + 40 * coreStrength) * o.brightness);
            b = Math.floor((80 * intensity + 50 * coreStrength) * o.brightness);
          }
          context.fillStyle = `rgb(${r}, ${g}, ${b})`;
          context.globalAlpha = isLight
            ? Math.min(1, 0.22 + Math.pow(intensity, 0.68) * 0.78)
            : intensity;
          context.fillRect(px, py, o.pixelSize - 1, o.pixelSize - 1);
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
