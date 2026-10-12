"use client";
// Ported from ThreeUI Community's Sliding Text CTA (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RollLabelProps {
  label?: string;
  hue?: number;
  saturation?: number;
  brightness?: number;
  background?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const EASE = "ease-[cubic-bezier(0.15,0.83,0.66,1)]";

export function RollLabel({
  hue = 0,
  saturation = 1,
  brightness = 1,
  background,
  onClick,
  className,
  label = "Open the archive",
}: RollLabelProps) {
  const prefersReducedMotion = useReducedMotion();
  const filter = `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      className={cn("flex h-full w-full items-center justify-center overflow-hidden", className)}
      style={{ background, filter }}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group relative inline-flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-3.5 font-mono text-[12px] font-medium uppercase tracking-[0.18em] text-foreground",
          "shadow-[0_1px_0_hsl(var(--background)),0_10px_24px_-14px_hsl(var(--foreground)/0.45)] hover:border-[hsl(var(--primary)/0.5)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[hsl(var(--primary))]",
          !prefersReducedMotion && cn("transition-all duration-700 hover:-translate-y-[2px]", EASE),
        )}
      >
        <span
          className={cn(
            "relative z-10",
            !prefersReducedMotion &&
              "transition-all duration-500 ease-out group-hover:-translate-y-7 group-hover:opacity-0 group-hover:blur-[3px]",
          )}
        >
          {label}
        </span>
        {!prefersReducedMotion && (
          <span
            aria-hidden="true"
            className="absolute inset-0 z-10 flex translate-y-7 items-center justify-center gap-2 text-[hsl(var(--primary))] opacity-0 blur-[3px] transition-all duration-300 ease-in-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:blur-none"
          >
            {label}
            <span className="text-[13px] leading-none">&rarr;</span>
          </span>
        )}
        <span
          aria-hidden="true"
          className={cn(
            "absolute bottom-[7px] left-6 right-6 h-px origin-left scale-x-0 bg-[hsl(var(--primary)/0.6)] group-hover:scale-x-100",
            !prefersReducedMotion && cn("transition-transform duration-700", EASE),
          )}
        />
      </button>
    </div>
  );
}
