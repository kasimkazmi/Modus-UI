"use client";
// Ported from ThreeUI Community's Launch Button (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LaunchButtonProps {
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

export function LaunchButton({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  background,
  onClick,
  className,
  label = "Initialize Launch",
}: LaunchButtonProps) {
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
      <button type="button" onClick={onClick} className="group/btn relative">
        <div
          className={cn(
            "absolute -inset-1 rounded-xl bg-amber-500/40 opacity-40 blur group-hover/btn:opacity-75",
            !prefersReducedMotion && "transition duration-500",
          )}
        />
        <div
          className={cn(
            "relative flex items-center gap-3 rounded-xl bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 px-8 py-4 text-amber-950 shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_4px_0_#b45309,0_10px_15px_-3px_rgba(0,0,0,0.5)] active:shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_2px_0_#b45309]",
            !prefersReducedMotion && "transition-all duration-150 active:translate-y-[2px]",
          )}
        >
          <span className="text-lg font-medium tracking-tight">{label}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 fill-amber-950/20 stroke-[1.5]"
            aria-hidden="true"
          >
            <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
          </svg>
        </div>
      </button>
    </div>
  );
}
