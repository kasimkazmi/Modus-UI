"use client";
// Ported from ThreeUI Community's Meridian Keycap (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StampKeyProps {
  /** Ink-filled primary key or paper secondary key. */
  variant?: "primary" | "secondary";
  /** Button text. Defaults to "Commit" (primary) or "Save as draft" (secondary). */
  label?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function StampKey({ variant = "primary", label, onClick, className }: StampKeyProps) {
  const prefersReducedMotion = useReducedMotion();
  const primary = variant !== "secondary";
  const motion = prefersReducedMotion ? "transition-none" : "transition-all duration-150 ease-out";
  return (
    <div
      className={cn(
        "relative isolate grid h-full min-h-[240px] w-full place-items-center overflow-hidden",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group relative inline-flex h-16 shrink-0 cursor-pointer items-end rounded-[6px] border-0 p-0 font-mono text-[12px] font-medium uppercase tracking-[0.2em]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[hsl(var(--primary))]",
          primary
            ? "bg-[color-mix(in_oklab,hsl(var(--primary))_70%,hsl(var(--foreground)))]"
            : "bg-[hsl(var(--border))]",
        )}
      >
        <span
          className={cn(
            "relative mb-[6px] flex h-[58px] items-center gap-3 rounded-[6px] px-7 ring-1 ring-inset",
            motion,
            "-translate-y-0 group-hover:translate-y-[4px] group-active:translate-y-[6px]",
            primary
              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] ring-[hsl(var(--primary-foreground)/0.15)]"
              : "bg-[hsl(var(--card))] text-foreground ring-[hsl(var(--border))]",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "h-3 w-px",
              motion,
              primary
                ? "bg-[hsl(var(--primary-foreground)/0.35)] group-hover:bg-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted-foreground)/0.4)] group-hover:bg-[hsl(var(--primary))]",
            )}
          />
          {label ?? (primary ? "Commit" : "Save as draft")}
        </span>
      </button>
    </div>
  );
}
