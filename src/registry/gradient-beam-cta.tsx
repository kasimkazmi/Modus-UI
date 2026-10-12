"use client";
// Ported from ThreeUI Community's Gradient Beam CTA (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientBeamCtaProps {
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

const KEYFRAMES = `
@keyframes mgb-beam-spin { to { transform: rotate(360deg); } }
@keyframes mgb-dots-move { 0% { background-position: 0 0; } 100% { background-position: 24px 24px; } }
`;

export function GradientBeamCta({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  background,
  onClick,
  className,
  label = "Start Building",
}: GradientBeamCtaProps) {
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
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group relative isolate flex items-center justify-center overflow-hidden rounded-full pb-5 pl-12 pr-12 pt-5 text-sm font-medium uppercase tracking-widest text-white hover:shadow-[0_0_40px_-10px_rgba(234,88,12,0.5)] focus:outline-none",
          !prefersReducedMotion && "transition-all duration-500 hover:scale-[1.02]",
        )}
      >
        <div className="absolute inset-0 -z-20 overflow-hidden rounded-full p-[1px]">
          <div
            className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#ea580c_360deg)]"
            style={{
              animation: prefersReducedMotion ? "none" : "mgb-beam-spin 3s linear infinite",
            }}
          />
          <div className="absolute inset-[1px] rounded-full bg-black" />
        </div>
        <div className="absolute bottom-[2px] left-[2px] right-[2px] top-[2px] -z-10 overflow-hidden rounded-full bg-zinc-950">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/60 to-transparent" />
          <div
            className="absolute bottom-0 left-0 right-0 top-0 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "12px 12px",
              animation: prefersReducedMotion ? "none" : "mgb-dots-move 8s linear infinite",
            }}
          />
          <div
            className={cn(
              "pointer-events-none absolute bottom-0 left-1/2 h-1/2 w-2/3 -translate-x-1/2 rounded-full bg-orange-500/10 blur-2xl group-hover:bg-orange-500/30",
              !prefersReducedMotion && "transition-colors duration-500",
            )}
          />
        </div>
        <span className="relative z-10 text-white/90 transition-colors group-hover:text-white">
          {label}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn(
            "relative z-10 ml-2",
            !prefersReducedMotion && "transition-transform duration-300 group-hover:translate-x-1",
          )}
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
