"use client";
// Ported from ThreeUI Community's Tideform Outline (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HairlineCtaProps {
  /** Button text. */
  label?: string;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

/** A mono, uppercase hairline button whose ink floods up from the baseline on hover. */
export function HairlineCta({
  label = "Read the index",
  type = "button",
  onClick,
  className,
}: HairlineCtaProps) {
  const still = useReducedMotion();
  return (
    <div className={cn("relative grid h-full min-h-[240px] w-full place-items-center", className)}>
      <button
        type={type}
        onClick={onClick}
        className={cn(
          "group relative isolate inline-flex items-center gap-5 overflow-hidden border border-[hsl(var(--foreground)/0.35)] px-6 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-foreground",
          "transition-colors duration-300 hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[hsl(var(--ring))]",
          "before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-[hsl(var(--primary))] before:transition-transform before:duration-300 before:ease-[cubic-bezier(.2,.8,.2,1)] hover:before:scale-y-100",
          still && "transition-none before:transition-none",
        )}
      >
        <span className="text-[hsl(var(--muted-foreground))] transition-colors group-hover:text-[hsl(var(--primary-foreground)/0.7)]">
          01
        </span>
        <span>{label}</span>
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={cn(
            "h-3 w-3 fill-none stroke-current stroke-[1.4] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
            still && "transition-none",
          )}
        >
          <path d="M2 10 10 2M4 2h6v6" />
        </svg>
      </button>
    </div>
  );
}
