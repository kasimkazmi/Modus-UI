"use client";
// Ported from ThreeUI Community's Floating Dots CTA (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingDotsCtaProps {
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

const POINTS: [string, number, number, number][] = [
  // left, opacity, duration (s), delay (s)
  ["10%", 1, 2.35, 0.2],
  ["30%", 0.7, 2.5, 0.5],
  ["25%", 0.8, 2.2, 0.1],
  ["44%", 0.6, 2.05, 0],
  ["50%", 1, 1.9, 0],
  ["75%", 0.5, 1.5, 1.5],
  ["88%", 0.9, 2.2, 0.2],
  ["58%", 0.8, 2.25, 0.2],
  ["98%", 0.6, 2.6, 0.1],
  ["65%", 1, 2.5, 0.2],
];

const STYLES = `
.mfd-button {
  cursor: pointer; position: relative; display: inline-flex; align-items: center; justify-content: center;
  overflow: hidden; transition: all 0.25s ease;
  background: radial-gradient(65.28% 65.28% at 50% 100%, rgba(34, 211, 238, 0.8) 0%, rgba(34, 211, 238, 0) 100%),
    linear-gradient(0deg, #2563eb, #2563eb);
  border-radius: 0.75rem; border: none; outline: none; padding: 12px 18px; min-height: 48px; min-width: 102px;
  font: inherit;
}
.mfd-button::before, .mfd-button::after { content: ""; position: absolute; transition: all 0.5s ease-in-out; z-index: 0; }
.mfd-button::before {
  inset: 1px; border-radius: calc(0.75rem - 1px);
  background: linear-gradient(177.95deg, rgba(255, 255, 255, 0.19) 0%, rgba(255, 255, 255, 0) 100%);
}
.mfd-button::after {
  inset: 2px; border-radius: calc(0.75rem - 2px);
  background: radial-gradient(65.28% 65.28% at 50% 100%, rgba(34, 211, 238, 0.8) 0%, rgba(34, 211, 238, 0) 100%),
    linear-gradient(0deg, #2563eb, #2563eb);
}
.mfd-button:active { transform: scale(0.95); }
.mfd-points { overflow: hidden; width: 100%; height: 100%; pointer-events: none; position: absolute; z-index: 1; }
.mfd-point {
  bottom: -10px; position: absolute; animation: mfd-floating infinite ease-in-out; pointer-events: none;
  width: 2px; height: 2px; background-color: #fff; border-radius: 9999px;
}
@keyframes mfd-floating {
  0% { transform: translateY(0); }
  85% { opacity: 0; }
  100% { transform: translateY(-55px); opacity: 0; }
}
${POINTS.map(
  ([left, opacity, duration, delay], index) =>
    `.mfd-point:nth-child(${index + 1}) { left: ${left}; opacity: ${opacity}; animation-duration: ${duration}s; animation-delay: ${delay}s; }`,
).join("\n")}
.mfd-inner {
  z-index: 2; gap: 6px; position: relative; width: 100%; color: white; display: inline-flex;
  align-items: center; justify-content: center; font-size: 16px; font-weight: 500; line-height: 1.5;
  transition: color 0.2s ease-in-out;
}
.mfd-icon { width: 18px; height: 18px; transition: transform 0.3s ease; stroke: white; fill: none; }
.mfd-button:hover .mfd-icon { transform: translateX(2px); }
.mfd-button:hover .mfd-icon path { animation: mfd-dash 0.8s linear forwards; }
@keyframes mfd-dash {
  0% { stroke-dasharray: 0, 20; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 10, 10; stroke-dashoffset: -5; }
  100% { stroke-dasharray: 20, 0; stroke-dashoffset: -10; }
}
.mfd-button[data-reduced], .mfd-button[data-reduced] *, .mfd-button[data-reduced]::before, .mfd-button[data-reduced]::after {
  animation: none !important; transition: none !important;
}
.mfd-button[data-reduced]:active, .mfd-button[data-reduced]:hover .mfd-icon { transform: none; }
`;

export function FloatingDotsCta({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  background,
  onClick,
  className,
  label = "Sign Up",
}: FloatingDotsCtaProps) {
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
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button
        type="button"
        onClick={onClick}
        className="mfd-button"
        data-reduced={prefersReducedMotion ? "" : undefined}
      >
        <div className="mfd-points">
          {Array.from({ length: 10 }, (_, index) => (
            <i key={index} className="mfd-point" />
          ))}
        </div>
        <span className="mfd-inner">
          {label}
          <svg
            className="mfd-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
      </button>
    </div>
  );
}
