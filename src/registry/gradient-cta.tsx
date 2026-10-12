"use client";
// Ported from ThreeUI Community's Gradient CTA (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GradientCtaProps {
  label?: string;
  fromColor?: string;
  toColor?: string;
  textColor?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function GradientCta({
  label = "Start Free Pilot",
  fromColor = "#FFEBB1",
  toColor = "#FFC438",
  textColor = "#7c2d12",
  onClick,
  className,
}: GradientCtaProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl pb-4 pl-8 pr-8 pt-4 font-medium",
        !prefersReducedMotion && "transition-all duration-300",
        className,
      )}
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: textColor,
        backgroundImage: `linear-gradient(to right, ${fromColor}, ${toColor})`,
        boxShadow:
          "0 15px 33px -12px rgba(255,162,42,0.9), inset 0 4px 6.3px rgba(252,220,134,1), inset 0 -5px 6.3px rgba(255,162,38,1)",
        borderRadius: 9999,
      }}
    >
      <div
        className={cn(
          "absolute inset-0 translate-y-full bg-white/20 group-hover:translate-y-0",
          !prefersReducedMotion && "transition-transform duration-300",
        )}
      />
      <span className="relative flex items-center gap-2">
        {label}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
          <path d="m21.854 2.147-10.94 10.939" />
        </svg>
      </span>
    </button>
  );
}
