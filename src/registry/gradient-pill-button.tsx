"use client";
// Ported from ThreeUI Community's Gradient Pill Button (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientPillButtonProps {
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

// The authored --border-gradient hairline drawn by a masked ::before.
const BORDER_STYLE = `
.mgp-button::before {
  content: ""; position: absolute; inset: 0; padding: 1px; border-radius: 9999px;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0.4), rgba(255, 255, 255, 0.8));
  pointer-events: none;
}
`;

export function GradientPillButton({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  background,
  onClick,
  className,
  label = "Demo Lesson",
}: GradientPillButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const filter = `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  const dark = mode === "dark";

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
      <style dangerouslySetInnerHTML={{ __html: BORDER_STYLE }} />
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "mgp-button relative flex items-center gap-x-2 gap-y-2 rounded-full bg-gradient-to-b pb-3 pl-6 pr-6 pt-3 text-sm font-medium",
          dark
            ? "from-white/[0.16] via-white/[0.07] to-white/[0.16] text-slate-200 hover:bg-white/10"
            : "from-black/10 via-black/20 to-black/10 text-slate-600 hover:bg-slate-50",
          !prefersReducedMotion && "transition-all",
        )}
        style={{
          boxShadow: "0 18px 35px rgba(31, 41, 55, 0.25), 0 0 0 1px rgba(209, 213, 219, 0.3)",
          color: "#e5e7eb",
        }}
      >
        <span
          className={cn(
            "text-sm font-medium tracking-tight",
            dark ? "text-white/70" : "text-black/60",
          )}
        >
          {label}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={dark ? "#e5e7eb" : "#666"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-[16px] w-[16px]"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
