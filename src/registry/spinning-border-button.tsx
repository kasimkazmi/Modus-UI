"use client";
// Ported from ThreeUI Community's Spinning Border Button (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SpinningBorderButtonProps {
  label?: string;
  beamColor?: string;
  speed?: number;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function SpinningBorderButton({
  label = "Request Demo",
  beamColor = "#ffffff",
  speed = 3,
  onClick,
  className,
}: SpinningBorderButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const t = prefersReducedMotion ? "" : "transition-all duration-300";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[1px] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]",
        !prefersReducedMotion && "transition-all duration-300 hover:-translate-y-0.5",
        className,
      )}
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      <span
        className={cn(
          "absolute inset-[-100%] opacity-0 group-hover:opacity-100",
          t,
          !prefersReducedMotion && "animate-spin",
        )}
        style={{
          animationDuration: `${speed}s`,
          background: `conic-gradient(from 90deg at 50% 50%, transparent 0%, transparent 75%, ${beamColor} 100%)`,
        }}
      />
      <span className={cn("absolute inset-0 rounded-full bg-zinc-800 group-hover:opacity-0", t)} />
      <span
        className={cn(
          "relative flex h-full w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] group-hover:text-white",
          t,
        )}
      >
        <span className="relative z-10">{label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("relative z-10 group-hover:translate-x-0.5", t)}
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </button>
  );
}
