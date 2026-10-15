"use client";
// Wrapper that bursts radiating spark lines from every click.

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Easing = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface ClickSparkProps extends React.HTMLAttributes<HTMLDivElement> {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: Easing;
  extraScale?: number;
}

const EASE: Record<Easing, (t: number) => number> = {
  linear: (t) => t,
  "ease-in": (t) => t * t,
  "ease-out": (t) => 1 - (1 - t) * (1 - t),
  "ease-in-out": (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
};

interface Burst {
  x: number;
  y: number;
  born: number;
}

export function ClickSpark({
  sparkColor = "hsl(var(--primary))",
  sparkSize = 10,
  sparkRadius = 25,
  sparkCount = 8,
  duration = 500,
  easing = "ease-out",
  extraScale = 1,
  className,
  children,
  ...props
}: ClickSparkProps) {
  const reduceMotion = useReducedMotion();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const bursts = React.useRef<Burst[]>([]);
  const frame = React.useRef(0);

  React.useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const render = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    if (canvas.width !== Math.round(width * dpr)) canvas.width = Math.round(width * dpr);
    if (canvas.height !== Math.round(height * dpr)) canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    // The canvas cannot read CSS variables, so let the browser resolve the colour.
    canvas.style.color = sparkColor;
    ctx.strokeStyle = getComputedStyle(canvas).color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    const now = performance.now();
    bursts.current = bursts.current.filter((b) => now - b.born < duration);
    for (const burst of bursts.current) {
      const t = EASE[easing]((now - burst.born) / duration);
      const reach = t * sparkRadius * extraScale;
      const length = (1 - t) * sparkSize * extraScale;
      for (let i = 0; i < sparkCount; i++) {
        const angle = (i / sparkCount) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(burst.x + cos * reach, burst.y + sin * reach);
        ctx.lineTo(burst.x + cos * (reach + length), burst.y + sin * (reach + length));
        ctx.stroke();
      }
    }
    frame.current = bursts.current.length ? requestAnimationFrame(render) : 0;
  };

  return (
    <div
      {...props}
      className={cn("relative", className)}
      onClick={(event) => {
        props.onClick?.(event);
        if (reduceMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        bursts.current.push({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          born: performance.now(),
        });
        if (!frame.current) frame.current = requestAnimationFrame(render);
      }}
    >
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </div>
  );
}
