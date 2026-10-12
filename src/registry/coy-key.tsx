"use client";
// A key that sidesteps the pointer inside its field, teasing as it goes, until its patience runs out.

import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CoyKeyState {
  dodges: number;
  relented: boolean;
}

const TAUNTS = ["Reach for it", "Not quite", "Closer", "Patience", "Fine, yours"];

export interface CoyKeyProps {
  children?: ReactNode | ((state: CoyKeyState) => ReactNode);
  taunts?: string[];
  notice?: string;
  inkColor?: string;
  contrastColor?: string;
  fieldHeight?: number;
  reach?: number;
  radius?: number;
  falloff?: number;
  fleeDuration?: number;
  returnDuration?: number;
  returnBounce?: number;
  axis?: "x" | "y" | "both";
  wall?: "clamp" | "bounce";
  patience?: number;
  disabled?: boolean;
  onDodge?: (dodges: number) => void;
  onRelent?: () => void;
  onCatch?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function CoyKey({
  children,
  taunts = TAUNTS,
  notice = "",
  inkColor = "hsl(var(--foreground))",
  contrastColor = "hsl(var(--background))",
  fieldHeight = 240,
  reach = 72,
  radius = 120,
  falloff = 2,
  fleeDuration = 130,
  returnDuration = 620,
  returnBounce = 0.1,
  axis = "both",
  wall = "clamp",
  patience = 4,
  disabled = false,
  onDodge,
  onRelent,
  onCatch,
  style,
  className,
}: CoyKeyProps) {
  const reduce = useReducedMotion();
  const field = useRef<HTMLDivElement>(null);
  const key = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const busy = useRef(false);
  const [dodges, setDodges] = useState(0);
  const relented = dodges >= patience;

  const home = () => {
    const spring = {
      type: "spring" as const,
      duration: returnDuration / 1000,
      bounce: returnBounce,
    };
    animate(x, 0, spring);
    animate(y, 0, spring);
  };

  // Keeps an offset inside the field; "bounce" reflects off the wall instead of stopping at it.
  const fit = (v: number, limit: number) => {
    if (Math.abs(v) <= limit) return v;
    return wall === "bounce" ? Math.sign(v) * (2 * limit - Math.abs(v)) : Math.sign(v) * limit;
  };

  const onMove = (e: PointerEvent) => {
    if (disabled || relented || busy.current || !field.current || !key.current) return;
    const k = key.current.getBoundingClientRect();
    const dx = k.left + k.width / 2 - e.clientX;
    const dy = k.top + k.height / 2 - e.clientY;
    const d = Math.hypot(dx, dy);
    if (d > radius) return;
    const f = field.current.getBoundingClientRect();
    const strength = 0.4 + 0.6 * Math.pow(1 - d / radius, 1 / Math.max(falloff, 0.1));
    const len = d || 1;
    const nx = axis === "y" ? 0 : (dx || 1) / len;
    const ny = axis === "x" ? 0 : dy / len;
    const tx = fit(x.get() + nx * reach * strength, (f.width - k.width) / 2);
    const ty = fit(y.get() + ny * reach * strength, (f.height - k.height) / 2);
    const flee = { duration: reduce ? 0 : fleeDuration / 1000, ease: "easeOut" as const };
    busy.current = true;
    animate(x, tx, flee);
    animate(y, ty, { ...flee, onComplete: () => (busy.current = false) });
    const next = dodges + 1;
    setDodges(next);
    onDodge?.(next);
    if (next >= patience) {
      onRelent?.();
      home();
    }
  };

  const state = { dodges, relented };
  const caption = taunts[Math.min(dodges, taunts.length - 1)] ?? "";

  return (
    <div className={cn("w-full", className)} style={style}>
      <div
        ref={field}
        onPointerMove={onMove}
        onPointerLeave={() => !relented && home()}
        className="relative grid w-full touch-none place-items-center overflow-hidden"
        style={{ height: fieldHeight }}
      >
        <motion.button
          ref={key}
          type="button"
          disabled={disabled}
          onClick={() => onCatch?.()}
          style={{
            x,
            y,
            background: inkColor,
            color: contrastColor,
            outline: relented ? "none" : `1px dashed ${contrastColor}`,
            outlineOffset: -5,
          }}
          className="rounded-md px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-[outline-color] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50 motion-reduce:transition-none"
        >
          {typeof children === "function" ? children(state) : (children ?? caption)}
        </motion.button>
      </div>
      {notice && (
        <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
          {notice}
        </p>
      )}
    </div>
  );
}
