"use client";
// A range input drawn as bars that swell into a crest around the thumb.

import { useEffect, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface RouseTrackProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  bars?: number;
  height?: number;
  restHeight?: number;
  gap?: number;
  fillColor?: string;
  trackColor?: string;
  crestColor?: string;
  sensitivity?: number;
  reach?: number;
  skew?: number;
  glide?: number;
  smoothing?: number;
  showValue?: boolean;
  formatValue?: (value: number) => ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function RouseTrack({
  value,
  defaultValue = 50,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  bars = 48,
  height = 56,
  restHeight = 12,
  gap = 4,
  fillColor = "hsl(var(--primary))",
  trackColor = "hsl(var(--border))",
  crestColor = "",
  sensitivity = 1,
  reach = 6,
  skew = 0.6,
  glide = 0.3,
  smoothing = 100,
  showValue = true,
  formatValue,
  disabled = false,
  ariaLabel = "Value",
  className,
}: RouseTrackProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const ratio = (current - min) / (max - min || 1);
  const filled = Math.round(ratio * bars);

  // Crest centre in bar units; it follows the pointer while hovered, else the value.
  const target = useMotionValue(ratio * (bars - 1));
  const [hover, setHover] = useState<number | null>(null);
  const goal = hover ?? ratio * (bars - 1);
  useEffect(() => target.set(goal), [target, goal]);
  const crest = useSpring(target, {
    stiffness: reduce ? 10000 : 400 * (1 - glide) + 40,
    damping: reduce ? 200 : 30,
  });
  // The crest swells while engaged, and sinks back at rest.
  const strength = useSpring(hover === null ? 0.45 : 1, {
    duration: reduce ? 0 : smoothing / 1000,
    bounce: 0,
  });

  const set = (v: number) => {
    setInner(v);
    onChange?.(v);
  };

  return (
    <div className={cn("flex items-center gap-4", disabled && "opacity-50", className)}>
      <div
        className="relative flex flex-1 items-center"
        style={{ height, gap }}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          setHover(((e.clientX - box.left) / box.width) * (bars - 1));
        }}
        onPointerLeave={() => setHover(null)}
      >
        {Array.from({ length: bars }, (_, i) => (
          <Bar
            key={i}
            index={i}
            crest={crest}
            strength={strength}
            color={i < filled ? fillColor : trackColor}
            crestColor={crestColor}
            rest={restHeight}
            peak={height}
            reach={reach}
            skew={skew}
            sensitivity={sensitivity}
          />
        ))}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(e) => set(Number(e.target.value))}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span className="pointer-events-none absolute -inset-1 rounded-md ring-[hsl(var(--ring))] peer-focus-visible:ring-2" />
      </div>
      {showValue && (
        <output className="min-w-[3ch] text-right font-mono text-xs tabular-nums text-muted-foreground">
          {formatValue ? formatValue(current) : current}
        </output>
      )}
    </div>
  );
}

function Bar({
  index,
  crest,
  strength,
  color,
  crestColor,
  rest,
  peak,
  reach,
  skew,
  sensitivity,
}: {
  index: number;
  crest: MotionValue<number>;
  strength: MotionValue<number>;
  color: string;
  crestColor: string;
  rest: number;
  peak: number;
  reach: number;
  skew: number;
  sensitivity: number;
}) {
  // A bell around the crest; bars behind the crest fall off more slowly by `skew`.
  const lift = useTransform([crest, strength], ([c, s]: number[]) => {
    const d = index - c;
    const width = Math.max(reach, 0.5) * (d < 0 ? 1 + skew * 0.5 : 1 - skew * 0.3);
    return Math.exp(-(d * d) / (2 * width * width)) * s * Math.min(sensitivity, 2);
  });
  const h = useTransform(
    lift,
    (l) => Math.round(Math.min(peak, rest + (peak - rest) * l) * 10) / 10,
  );
  const glow = useTransform(lift, [0.4, 0.8], [0, 1]);

  return (
    <motion.span
      aria-hidden
      className="relative flex-1 overflow-hidden rounded-full"
      style={{ height: h, background: color }}
    >
      {crestColor && (
        <motion.span
          className="absolute inset-0"
          style={{ background: crestColor, opacity: glow }}
        />
      )}
    </motion.span>
  );
}
