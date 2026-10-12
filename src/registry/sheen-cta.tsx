"use client";
// Ported from ThreeUI Community's Trochil Signal (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SheenCtaProps {
  /** Button text. */
  label?: string;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

/** A paper pill with a serif italic label; a band of light sweeps across it on hover. */
export function SheenCta({
  label = "Join the folio",
  type = "button",
  onClick,
  className,
}: SheenCtaProps) {
  const still = useReducedMotion();
  return (
    <div className={cn("relative grid h-full min-h-[240px] w-full place-items-center", className)}>
      <button
        type={type}
        onClick={onClick}
        className={cn(
          "group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-full border border-border bg-[hsl(var(--card))] px-8 font-serif text-lg italic text-foreground",
          "shadow-[0_1px_0_hsl(var(--background))_inset,0_12px_28px_-14px_hsl(var(--foreground)/0.35)] transition-[transform,box-shadow,border-color] duration-300",
          "hover:-translate-y-0.5 hover:border-[hsl(var(--primary)/0.6)] hover:shadow-[0_1px_0_hsl(var(--background))_inset,0_18px_36px_-14px_hsl(var(--primary)/0.45)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[hsl(var(--ring))]",
          "before:absolute before:inset-0 before:-translate-x-[120%] before:bg-[linear-gradient(105deg,transparent_20%,hsl(var(--primary)/0.22)_50%,transparent_80%)] before:transition-transform before:duration-700 hover:before:translate-x-[120%]",
          still && "transition-none before:transition-none hover:translate-y-0",
        )}
      >
        <span className="relative h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" aria-hidden />
        <span className="relative">{label}</span>
      </button>
    </div>
  );
}
