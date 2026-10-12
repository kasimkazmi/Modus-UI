"use client";
// Ported from ThreeUI Community's Understory Arrow Pill (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface OrbitChipButtonProps {
  /** Button text. */
  label?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

/** A solid primary pill led by a paper chip whose arrow turns from diagonal to forward on hover. */
export function OrbitChipButton({
  label = "Start a draft",
  onClick,
  className,
}: OrbitChipButtonProps) {
  const still = useReducedMotion();
  return (
    <div className={cn("relative grid h-full min-h-[240px] w-full place-items-center", className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group inline-flex h-14 items-center gap-4 rounded-full bg-[hsl(var(--primary))] py-0 pl-2 pr-7 font-sans text-base font-medium text-[hsl(var(--primary-foreground))]",
          "shadow-[0_14px_30px_-12px_hsl(var(--primary)/0.55)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_38px_-12px_hsl(var(--primary)/0.6)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[hsl(var(--ring))]",
          still && "transition-none hover:translate-y-0",
        )}
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[hsl(var(--background))] text-foreground">
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
            className={cn(
              "h-3 w-3 -rotate-45 fill-none stroke-current stroke-2 transition-transform duration-300 group-hover:rotate-0",
              still && "transition-none",
            )}
          >
            <path d="M1.5 6h9M7 2.5 10.5 6 7 9.5" />
          </svg>
        </span>
        <span>{label}</span>
      </button>
    </div>
  );
}
