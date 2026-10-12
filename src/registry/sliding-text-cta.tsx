"use client";
// Ported from ThreeUI Community's Sliding Text CTA (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SlidingTextCtaProps {
  mode?: "light" | "dark";
  label?: string;
  hue?: number;
  saturation?: number;
  brightness?: number;
  background?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export function SlidingTextCta({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  background,
  onClick,
  className,
  label = "Download Mac app",
}: SlidingTextCtaProps) {
  const prefersReducedMotion = useReducedMotion();
  const filter = `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center overflow-hidden subpixel-antialiased",
        className,
      )}
      style={{
        background: background ?? (mode === "light" ? "#f4f7fb" : "#111318"),
        fontFamily: FONT,
        colorScheme: mode,
        filter,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group relative inline-flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-full border border-neutral-600 bg-neutral-800 pb-[12px] pl-[20px] pr-[20px] pt-[12px] font-semibold tracking-tight text-neutral-400 shadow-[0_2.8px_2.2px_rgba(0,0,0,0.3),_0_6.7px_5.3px_rgba(0,0,0,0.35),_0_12.5px_10px_rgba(0,0,0,0.4)] hover:text-white",
          !prefersReducedMotion &&
            "transition-all duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] hover:-translate-y-[3px]",
        )}
      >
        <span
          className={cn(
            "relative z-10 rounded-full font-medium",
            !prefersReducedMotion &&
              "transition-all duration-500 ease-out group-hover:translate-y-8 group-hover:opacity-0 group-hover:blur-md",
          )}
        >
          {label}
        </span>
        {!prefersReducedMotion && (
          <span
            aria-hidden="true"
            className="absolute inset-0 z-10 flex -translate-y-8 items-center justify-center rounded-full font-medium opacity-0 blur-md transition-all duration-300 ease-in-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:blur-none"
          >
            {label}
          </span>
        )}
        <span
          aria-hidden="true"
          className={cn(
            "absolute bottom-0 left-1/2 h-[1px] w-[70%] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent blur-[2px] group-hover:opacity-80",
            !prefersReducedMotion &&
              "transition-all duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)]",
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 right-0 h-[100%] rounded-full bg-gradient-to-t from-white/20 via-white/10 to-transparent group-hover:opacity-60",
            !prefersReducedMotion &&
              "transition-all duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)]",
          )}
        />
      </button>
    </div>
  );
}
