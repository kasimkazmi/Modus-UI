"use client";

// Ported from ThreeUI Community's Lumen CTA (MIT, © 2026 Meng To).

import type { CSSProperties, MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LumenCtaProps {
  variant?: "primary" | "ghost";
  mode?: "light" | "dark";
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

// The authored .btn-primary gradient from lumen.html.
const PRIMARY_GRADIENT =
  "linear-gradient(90deg, #050014 0%, #0d0029 20%, #1e0066 40%, #2f00ab 60%, #5227c0 75%, #9470d9 100%)";

export function LumenCta({
  variant = "primary",
  mode = "dark",
  label = "Get your card",
  ring = true,
  hue = 0,
  saturation = 1,
  brightness = 1,
  disabled = false,
  type = "button",
  onClick,
  background,
  className,
}: LumenCtaProps) {
  const prefersReducedMotion = useReducedMotion();
  const ghost = variant === "ghost";
  const light = mode === "light";
  const grade = `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)})`;
  const level = clamp(brightness, 0.35, 1.65);

  const buttonStyle: CSSProperties = ghost
    ? {
        background: light ? "rgba(12, 6, 34, 0.03)" : "rgba(255, 255, 255, 0.018)",
        outlineColor: light ? "rgba(12, 6, 34, 0.16)" : "rgba(255, 255, 255, 0.2)",
        color: light ? "#1a1033" : "#fff",
        filter: `${grade} brightness(${level})`,
        transition: prefersReducedMotion
          ? "none"
          : "background 0.25s ease, outline-color 0.25s ease",
      }
    : {
        background: PRIMARY_GRADIENT,
        boxShadow: "0 4px 22px rgba(70, 20, 190, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.14)",
        filter: `${grade} brightness(calc(${level} * var(--lumen-cta-lift, 1)))`,
        transition: prefersReducedMotion ? "none" : "filter 0.25s ease",
      };

  return (
    <div
      className={cn(
        "relative isolate grid h-full min-h-0 w-full min-w-0 place-items-center overflow-hidden",
        className,
      )}
      style={{ background: background ?? (light ? "#f3f0fb" : "#0b0821") }}
    >
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "relative inline-flex h-[45px] cursor-pointer appearance-none items-center gap-[10px] whitespace-nowrap rounded-full border-0 text-[15.7px] font-semibold leading-none no-underline",
          "outline-1 outline-[rgba(255,255,255,0.1)] [outline-style:solid]",
          "[font-family:Mulish,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]",
          "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:!outline-[rgba(255,255,255,0.85)]",
          "disabled:cursor-default disabled:opacity-55",
          ghost
            ? cn(
                "px-[33px] backdrop-blur-[12px]",
                light
                  ? "hover:enabled:!bg-[rgba(12,6,34,0.07)]"
                  : "hover:enabled:!bg-[rgba(255,255,255,0.09)]",
              )
            : "px-[30px] text-white hover:enabled:[--lumen-cta-lift:1.12]",
        )}
        style={buttonStyle}
      >
        {label}
        {ring ? (
          <i
            aria-hidden="true"
            className="h-[7px] w-[7px] flex-none rounded-full border-[1.3px] border-solid"
            style={{
              borderColor: ghost && light ? "rgba(26, 16, 51, 0.75)" : "rgba(255, 255, 255, 0.9)",
            }}
          />
        ) : null}
      </button>
    </div>
  );
}
