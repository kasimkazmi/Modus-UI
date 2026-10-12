"use client";
// Ported from ThreeUI Community's Spinning Border Button (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HaloTraceProps {
  label?: string;
  beamColor?: string;
  speed?: number;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function HaloTrace({
  label = "Send for review",
  beamColor = "hsl(var(--primary))",
  speed = 4,
  onClick,
  className,
}: HaloTraceProps) {
  const prefersReducedMotion = useReducedMotion();
  const t = prefersReducedMotion ? "" : "transition-all duration-300";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[1.5px] hover:shadow-[0_12px_30px_-12px_hsl(var(--primary)/0.5)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[hsl(var(--primary))]",
        !prefersReducedMotion && "transition-all duration-300 hover:-translate-y-0.5",
        className,
      )}
    >
      <span className="absolute inset-0 rounded-full bg-[hsl(var(--border))]" />
      <span
        className={cn(
          "absolute inset-[-100%] opacity-60 group-hover:opacity-100",
          t,
          !prefersReducedMotion && "animate-spin",
        )}
        style={{
          animationDuration: `${speed}s`,
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0%, transparent 62%, ${beamColor} 100%)`,
        }}
      />
      <span
        className={cn(
          "relative flex h-full w-full items-center justify-center gap-2.5 rounded-full bg-[hsl(var(--card))] px-6 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] group-hover:text-foreground",
          t,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary)/0.35)] group-hover:bg-[hsl(var(--primary))]",
            t,
          )}
        />
        <span className="relative z-10">{label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("relative z-10 group-hover:translate-x-0.5", t)}
          aria-hidden="true"
        >
          <path d="M7 17 17 7" />
          <path d="M8 7h9v9" />
        </svg>
      </span>
    </button>
  );
}
