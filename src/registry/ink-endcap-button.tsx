"use client";
// Ported from ThreeUI Community's Halvorsen Arrow Pill (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface InkEndcapButtonProps {
  /** Button text. */
  label?: string;
  /** `solid` is ink on paper; `outline` is a hairline ring with an ink endcap. */
  variant?: "solid" | "outline";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function InkEndcapButton({
  label = "Open the archive",
  variant = "outline",
  onClick,
  className,
}: InkEndcapButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const solid = variant === "solid";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex h-14 items-center gap-5 rounded-full pl-8 pr-2 font-serif text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        solid
          ? "bg-[hsl(var(--primary))] text-primary-foreground shadow-[0_14px_30px_-12px_hsl(var(--primary)/0.6)]"
          : "border border-[hsl(var(--foreground)/0.25)] bg-transparent text-foreground hover:border-[hsl(var(--primary))]",
        !prefersReducedMotion &&
          "transition-[transform,border-color] duration-300 hover:-translate-y-0.5",
        className,
      )}
    >
      <span className="italic">{label}</span>
      <span
        aria-hidden
        className={cn(
          "relative grid h-10 w-10 place-items-center overflow-hidden rounded-full",
          solid
            ? "bg-[hsl(var(--background))] text-foreground"
            : "bg-[hsl(var(--primary))] text-primary-foreground",
        )}
      >
        <svg
          viewBox="0 0 12 12"
          className={cn(
            "h-3 w-3 fill-none stroke-current [stroke-width:1.75]",
            !prefersReducedMotion &&
              "transition-transform duration-300 group-hover:translate-x-0.5",
          )}
        >
          <path d="M1.5 6h8M6 2.5 9.5 6 6 9.5" />
        </svg>
      </span>
    </button>
  );
}
