"use client";
// Ported from ThreeUI Community's Gradient Beam CTA (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CometRingButtonProps {
  label?: string;
  /** Seconds for the comet to complete one lap of the rim. */
  speed?: number;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const KEYFRAMES = `
@keyframes mcr-orbit { to { transform: rotate(360deg); } }
@keyframes mcr-grain { to { background-position: 18px 0; } }
`;

export function CometRingButton({
  label = "Begin a draft",
  speed = 4,
  onClick,
  className,
}: CometRingButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative isolate inline-flex items-center gap-3 overflow-hidden rounded-[14px] py-4 pl-7 pr-5 font-mono text-xs uppercase tracking-[0.22em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !prefersReducedMotion && "transition-transform duration-500 hover:-translate-y-0.5",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <span aria-hidden className="absolute inset-0 -z-20 overflow-hidden rounded-[14px]">
        <span className="absolute inset-0 bg-[hsl(var(--border))]" />
        <span
          className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0 250deg, hsl(var(--primary) / 0.2) 300deg, hsl(var(--primary)) 352deg, hsl(var(--background)) 357deg, transparent 360deg)",
            animation: prefersReducedMotion ? "none" : `mcr-orbit ${speed}s linear infinite`,
          }}
        />
      </span>
      <span
        aria-hidden
        className="absolute inset-[1.5px] -z-10 overflow-hidden rounded-[12.5px] bg-card"
      >
        <span
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, hsl(var(--foreground) / 0.07) 0 1px, transparent 1px 6px)",
            animation: prefersReducedMotion ? "none" : "mcr-grain 6s linear infinite",
          }}
        />
        <span
          className={cn(
            "absolute -bottom-6 left-1/2 h-12 w-3/4 -translate-x-1/2 rounded-full bg-[hsl(var(--primary)/0.12)] blur-xl group-hover:bg-[hsl(var(--primary)/0.3)]",
            !prefersReducedMotion && "transition-colors duration-500",
          )}
        />
      </span>
      <span className="relative">{label}</span>
      <span
        aria-hidden
        className={cn(
          "relative grid h-6 w-6 place-items-center rounded-full border border-[hsl(var(--primary)/0.5)] text-[hsl(var(--primary))]",
          !prefersReducedMotion && "transition-transform duration-300 group-hover:rotate-45",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      </span>
    </button>
  );
}
