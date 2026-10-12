"use client";
// Ported from ThreeUI Community's Gradient CTA (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GlazeButtonProps {
  label?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function GlazeButton({ label = "Send the brief", onClick, className }: GlazeButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[10px] px-7 py-3.5 font-serif text-lg text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !prefersReducedMotion &&
          "transition-[transform,box-shadow] duration-300 active:translate-y-px",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(160deg, color-mix(in srgb, hsl(var(--primary)) 72%, white) 0%, hsl(var(--primary)) 55%, color-mix(in srgb, hsl(var(--primary)) 78%, black) 100%)",
        boxShadow:
          "0 14px 30px -14px hsl(var(--primary) / 0.85), inset 0 1px 0 rgb(255 255 255 / 0.35), inset 0 -3px 6px rgb(0 0 0 / 0.22)",
      }}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.35),transparent)] group-hover:left-[120%]",
          !prefersReducedMotion && "transition-[left] duration-700 ease-out",
        )}
      />
      <span className="relative flex items-center gap-3">
        {label}
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">↵</span>
      </span>
    </button>
  );
}
