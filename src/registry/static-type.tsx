"use client";
// Display type drawn on a canvas whose pixel rows jitter sideways like a weak signal.

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StaticTypeProps {
  children?: React.ReactNode;
  fontSize?: string;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  className?: string;
}

const BAND = 3; // pixel rows that move together

export function StaticType({
  children,
  fontSize = "clamp(3rem, 8vw, 6rem)",
  fontWeight = 400,
  fontFamily = "",
  color = "hsl(var(--foreground))",
  enableHover = true,
  baseIntensity = 0.12,
  hoverIntensity = 0.6,
  className,
}: StaticTypeProps) {
  const probeRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const reduced = useReducedMotion();
  const text = String(children ?? "");

  useEffect(() => {
    const probe = probeRef.current;
    const canvas = canvasRef.current;
    if (!probe || !canvas) return;
    let frame = 0;
    let cancelled = false;

    const start = async () => {
      await document.fonts.ready;
      if (cancelled) return;
      const style = getComputedStyle(probe);
      const size = parseFloat(style.fontSize);
      const font = `${fontWeight} ${size}px ${style.fontFamily}`;
      const dpr = window.devicePixelRatio || 1;
      const pad = size * 0.4;

      const ink = document.createElement("canvas");
      const ictx = ink.getContext("2d")!;
      ictx.font = font;
      const w = Math.ceil(ictx.measureText(text).width + pad * 2);
      const h = Math.ceil(size * 1.3);
      ink.width = w * dpr;
      ink.height = h * dpr;
      ictx.scale(dpr, dpr);
      ictx.font = font;
      ictx.fillStyle = style.color;
      ictx.textBaseline = "middle";
      ictx.fillText(text, pad, h / 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      setBox({ w, h });
      const ctx = canvas.getContext("2d")!;
      const band = BAND * dpr;

      const draw = () => {
        const level = hoverRef.current && enableHover ? hoverIntensity : baseIntensity;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < canvas.height; y += band) {
          const kick = Math.random() < level * 0.5 ? (Math.random() - 0.5) * pad * 2 * level : 0;
          const shift = (Math.random() - 0.5) * pad * 0.15 * level + kick;
          ctx.drawImage(ink, 0, y, ink.width, band, shift * dpr, y, ink.width, band);
        }
        if (!reduced) frame = requestAnimationFrame(draw);
      };
      draw();
    };
    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [
    text,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    enableHover,
    baseIntensity,
    hoverIntensity,
    reduced,
  ]);

  return (
    <span
      className={cn("relative inline-block font-serif", className)}
      onPointerEnter={() => (hoverRef.current = true)}
      onPointerLeave={() => (hoverRef.current = false)}
    >
      <span
        ref={probeRef}
        aria-hidden
        className="pointer-events-none absolute opacity-0"
        style={{ fontSize, fontFamily: fontFamily || undefined, color }}
      />
      <span className="sr-only">{text}</span>
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ width: box.w, height: box.h, display: "block" }}
      />
    </span>
  );
}
