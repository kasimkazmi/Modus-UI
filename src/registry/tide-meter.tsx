"use client";
// Vertical level meter whose liquid surface tilts and sloshes as the level moves.

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useSpring, useTransform, useVelocity } from "framer-motion";
import { cn } from "@/lib/utils";

interface TideMeterProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  interactive?: boolean;
  showValue?: boolean;
  disabled?: boolean;
  liquidColor?: string;
  glassColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  ticks?: number;
  /** 0–1: higher settles more slowly and heavily. */
  viscosity?: number;
  /** How far the surface leans with speed. */
  tilt?: number;
  /** How much the surface bulges with speed. */
  splash?: number;
  unit?: string;
  ariaLabel?: string;
  className?: string;
}

const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)));

export function TideMeter({
  value,
  defaultValue = 60,
  onChange,
  interactive = true,
  showValue = true,
  disabled = false,
  liquidColor = "hsl(var(--primary))",
  glassColor = "hsl(var(--muted))",
  width = 76,
  height = 200,
  radius = 12,
  ticks = 4,
  viscosity = 0.15,
  tilt = 0.45,
  splash = 0.42,
  unit = "%",
  ariaLabel = "Level",
  className,
}: TideMeterProps) {
  const reduced = useReducedMotion();
  const [inner, setInner] = useState(defaultValue);
  const level = clamp(value ?? inner);
  const live = interactive && !disabled;

  const shown = useSpring(level, {
    stiffness: 120,
    damping: 6 + viscosity * 40,
    mass: 1 + viscosity * 3,
  });
  useEffect(() => {
    if (reduced) shown.jump(level);
    else shown.set(level);
  }, [level, reduced, shown]);
  const speed = useVelocity(shown);
  const surface = useTransform(() => {
    const y = height * (1 - shown.get() / 100);
    const v = Math.max(-1, Math.min(1, speed.get() / 300));
    const lean = v * tilt * width * 0.5;
    const bulge = -Math.abs(v) * splash * 16;
    return `M0 ${y + lean} Q${width / 2} ${y + bulge} ${width} ${y - lean} V${height} H0Z`;
  });
  const overClip = useTransform(shown, (v) => `inset(${100 - v}% 0 0 0)`);
  const readout = useTransform(shown, (v) => `${Math.round(v)}${unit}`);

  const set = (next: number) => {
    const v = clamp(next);
    if (value === undefined) setInner(v);
    onChange?.(v);
  };
  const fromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    set(((b.bottom - e.clientY) / b.height) * 100);
  };

  return (
    <div
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={level}
      aria-valuetext={`${level}${unit}`}
      aria-disabled={disabled}
      aria-readonly={!interactive}
      tabIndex={live ? 0 : -1}
      className={cn(
        "relative overflow-hidden border border-[hsl(var(--border))] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
        live && "cursor-ns-resize",
        disabled && "opacity-50",
        className,
      )}
      style={{ width, height, borderRadius: radius, background: glassColor, touchAction: "none" }}
      onPointerDown={(e) => {
        if (!live) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        fromPointer(e);
      }}
      onPointerMove={(e) =>
        live && e.currentTarget.hasPointerCapture(e.pointerId) && fromPointer(e)
      }
      onKeyDown={(e) => {
        if (!live) return;
        const step = {
          ArrowUp: 1,
          ArrowRight: 1,
          ArrowDown: -1,
          ArrowLeft: -1,
          PageUp: 10,
          PageDown: -10,
        }[e.key];
        if (e.key === "Home") set(0);
        else if (e.key === "End") set(100);
        else if (!step) return;
        else set(level + step * (e.shiftKey ? 10 : 1));
        e.preventDefault();
      }}
    >
      <svg className="absolute inset-0" width={width} height={height} aria-hidden>
        <motion.path d={surface} fill={liquidColor} />
        {Array.from({ length: ticks }, (_, i) => {
          const y = (height * (i + 1)) / (ticks + 1);
          return (
            <line
              key={i}
              x1={width - 12}
              x2={width}
              y1={y}
              y2={y}
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity={0.4}
            />
          );
        })}
      </svg>
      {showValue &&
        [false, true].map((over) => (
          <motion.span
            key={String(over)}
            aria-hidden
            className="absolute inset-0 flex items-center justify-center font-mono text-xs tabular-nums"
            style={{
              color: over ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
              clipPath: over ? overClip : undefined,
            }}
          >
            {readout}
          </motion.span>
        ))}
    </div>
  );
}
