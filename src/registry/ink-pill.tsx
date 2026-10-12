"use client";

// Ported from ThreeUI Community's Lumen CTA (MIT, © 2026 Meng To).

import type { CSSProperties, MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InkPillProps {
  variant?: "primary" | "ghost";
  label?: string;
  ring?: boolean;
  hue?: number;
  saturation?: number;
  brightness?: number;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  background?: string;
  className?: string;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

// An ink wash: full primary on the left, thinning into the paper on the right.
const INK_WASH =
  "linear-gradient(100deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 45%, color-mix(in oklab, hsl(var(--primary)) 62%, hsl(var(--background))) 100%)";

export function InkPill({
  variant = "primary",
  label = "Begin a draft",
  ring = true,
  hue = 0,
  saturation = 1,
  brightness = 1,
  disabled = false,
  type = "button",
  onClick,
  background,
  className,
}: InkPillProps) {
  const prefersReducedMotion = useReducedMotion();
  const ghost = variant === "ghost";
  const grade = `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)})`;
  const level = clamp(brightness, 0.35, 1.65);
  const transition = prefersReducedMotion
    ? "none"
    : "filter 0.25s ease, background 0.25s ease, transform 0.25s ease";

  const buttonStyle: CSSProperties = ghost
    ? { filter: `${grade} brightness(${level})`, transition }
    : {
        background: INK_WASH,
        boxShadow:
          "0 10px 24px -12px hsl(var(--primary) / 0.55), inset 0 1px 0 hsl(var(--primary-foreground) / 0.18)",
        filter: `${grade} brightness(calc(${level} * var(--ink-pill-lift, 1)))`,
        transition,
      };

  return (
    <div
      className={cn(
        "relative isolate grid h-full min-h-0 w-full min-w-0 place-items-center overflow-hidden",
        className,
      )}
      style={background ? { background } : undefined}
    >
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "relative inline-flex h-12 cursor-pointer appearance-none items-center gap-3 whitespace-nowrap rounded-full border-0 pl-7 pr-5 font-mono text-[12px] font-medium uppercase leading-none tracking-[0.18em]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[hsl(var(--primary))]",
          "disabled:cursor-default disabled:opacity-55",
          !prefersReducedMotion && "active:enabled:translate-y-px",
          ghost
            ? "bg-[hsl(var(--card))] text-foreground ring-1 ring-[hsl(var(--border))] hover:enabled:bg-[hsl(var(--primary)/0.08)]"
            : "text-[hsl(var(--primary-foreground))] hover:enabled:[--ink-pill-lift:1.12]",
        )}
        style={buttonStyle}
      >
        {label}
        {ring ? (
          <i
            aria-hidden="true"
            className={cn(
              "h-[7px] w-[7px] flex-none rotate-45 border-[1.3px] border-solid",
              ghost ? "border-[hsl(var(--primary))]" : "border-[hsl(var(--primary-foreground))]",
            )}
          />
        ) : null}
      </button>
    </div>
  );
}
