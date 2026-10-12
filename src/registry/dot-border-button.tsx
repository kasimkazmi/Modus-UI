"use client";
// Ported from ThreeUI Community's Dot Border Button (MIT, © 2026 Meng To).

import type { CSSProperties, MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DotBorderButtonProps {
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

// Authored on black in white ink; the light mode swaps the same alphas to near-black.
const INK = {
  dark: { dot: "#fffa", grid: "#fff3", label: "#fffd", stroke: "#fff4", fill: "#fff2" },
  light: { dot: "#111a", grid: "#1113", label: "#111d", stroke: "#1114", fill: "#1112" },
};

const STYLES = `
.mdb-wrapper {
  --dot-size: 8px; --line-weight: 1px; --line-distance: 0.8rem 1rem; --animation-speed: 0.35s;
  position: relative; display: inline-flex; justify-content: center; align-items: center;
  padding: var(--line-distance); user-select: none; isolation: isolate;
}
.mdb-wrapper::after {
  content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: inherit;
  pointer-events: none; background-image: repeating-linear-gradient(45deg, var(--grid-color) 0 1px, transparent 2px 5px);
  opacity: 0; z-index: -1;
}
.mdb-wrapper:has(.mdb-btn:hover)::after { animation: mdb-opacity calc(var(--animation-speed) * 4) ease-in-out forwards; }
@keyframes mdb-opacity { 80% { opacity: 0; } 100% { opacity: 1; } }
.mdb-btn {
  position: relative; display: flex; justify-content: center; align-items: center; padding: 0.8rem 1.25rem;
  background-color: #fff0; border: 1px solid var(--grid-color); color: var(--label-color);
  font-family: "Inter", sans-serif; letter-spacing: -0.01em; font-size: 1rem; font-weight: 600; line-height: 1.5;
  text-transform: capitalize; border-radius: 6px; cursor: pointer;
  transition: transform .2s ease-in-out, letter-spacing .2s ease-in-out;
}
.mdb-btn:hover { background-color: #25358b; color: #fff; transform: scale(1.05); letter-spacing: .06em; }
.mdb-btn:active { background-color: #25358b; transform: scale(.98); letter-spacing: .02em; }
.mdb-svg {
  margin-left: .5rem; height: 24px; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round;
  stroke: var(--svg-stroke); fill: var(--svg-fill); transition: all .2s ease-in-out;
}
.mdb-btn:hover .mdb-svg { stroke: var(--dot-color); fill: var(--grid-color); }
.mdb-dot {
  position: absolute; width: var(--dot-size); aspect-ratio: 1; border-radius: 2px;
  background-color: var(--dot-color); transition: all .3s ease-in-out; opacity: 0;
}
.mdb-wrapper:has(.mdb-btn:hover) .mdb-dot.mdb-top.mdb-left { top: 50%; left: 20%; animation: mdb-move-tl var(--animation-speed) ease-in-out forwards; }
@keyframes mdb-move-tl { 90% { opacity: .6; } 100% { top: calc(var(--dot-size) * -0.5); left: calc(var(--dot-size) * -0.5); opacity: 1; } }
.mdb-wrapper:has(.mdb-btn:hover) .mdb-dot.mdb-top.mdb-right { top: 50%; right: 20%; animation: mdb-move-tr var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * .6); }
@keyframes mdb-move-tr { 80% { opacity: .6; } 100% { top: calc(var(--dot-size) * -0.5); right: calc(var(--dot-size) * -0.5); opacity: 1; } }
.mdb-wrapper:has(.mdb-btn:hover) .mdb-dot.mdb-bottom.mdb-right { bottom: 50%; right: 20%; animation: mdb-move-br var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 1.2); }
@keyframes mdb-move-br { 80% { opacity: .6; } 100% { bottom: calc(var(--dot-size) * -0.5); right: calc(var(--dot-size) * -0.5); opacity: 1; } }
.mdb-wrapper:has(.mdb-btn:hover) .mdb-dot.mdb-bottom.mdb-left { bottom: 50%; left: 20%; animation: mdb-move-bl var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 1.8); }
@keyframes mdb-move-bl { 80% { opacity: .6; } 100% { bottom: calc(var(--dot-size) * -0.5); left: calc(var(--dot-size) * -0.5); opacity: 1; } }
.mdb-line { position: absolute; transition: all .3s ease-in-out; }
.mdb-line.mdb-horizontal {
  height: var(--line-weight); width: 100%;
  background-image: repeating-linear-gradient(90deg, #0000 0 calc(var(--line-weight) * 2), var(--dot-color) calc(var(--line-weight) * 2) calc(var(--line-weight) * 4));
}
.mdb-line.mdb-top { top: calc(var(--line-weight) * -0.5); transform-origin: top left; transform: rotate(5deg) scaleX(0); }
.mdb-wrapper:has(.mdb-btn:hover) .mdb-line.mdb-top { animation: mdb-draw-top var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * .8); }
@keyframes mdb-draw-top { 100% { transform: rotate(0deg) scaleX(1); } }
.mdb-line.mdb-bottom { bottom: calc(var(--line-weight) * -0.5); transform-origin: bottom right; transform: rotate(5deg) scaleX(0); }
.mdb-wrapper:has(.mdb-btn:hover) .mdb-line.mdb-bottom { animation: mdb-draw-bottom var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 2); }
@keyframes mdb-draw-bottom { 100% { transform: rotate(0deg) scaleX(1); } }
.mdb-line.mdb-vertical {
  width: var(--line-weight); height: 100%;
  background-image: repeating-linear-gradient(0deg, #0000 0 calc(var(--line-weight) * 2), var(--dot-color) calc(var(--line-weight) * 2) calc(var(--line-weight) * 4));
}
.mdb-line.mdb-left { left: calc(var(--line-weight) * -0.5); transform-origin: bottom left; transform: rotate(0deg) scaleY(0); }
.mdb-wrapper:has(.mdb-btn:hover) .mdb-line.mdb-left { animation: mdb-draw-left var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 2.4); }
@keyframes mdb-draw-left { 100% { transform: rotate(0deg) scaleY(1); } }
.mdb-line.mdb-right { right: calc(var(--line-weight) * -0.5); transform-origin: top right; transform: rotate(5deg) scaleY(0); }
.mdb-wrapper:has(.mdb-btn:hover) .mdb-line.mdb-right { animation: mdb-draw-right var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 1.4); }
@keyframes mdb-draw-right { 100% { transform: rotate(0deg) scaleY(1); } }
.mdb-wrapper[data-reduced] *, .mdb-wrapper[data-reduced]::after { animation-duration: 0.01ms !important; animation-delay: 0s !important; transition: none !important; }
.mdb-wrapper[data-reduced] .mdb-btn:hover, .mdb-wrapper[data-reduced] .mdb-btn:active { transform: none; letter-spacing: -0.01em; }
`;

export function DotBorderButton({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  background,
  onClick,
  className,
  label = "Start Creating",
}: DotBorderButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const filter = `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  const colors = INK[mode];
  const ink = {
    "--dot-color": colors.dot,
    "--grid-color": colors.grid,
    "--label-color": colors.label,
    "--svg-stroke": colors.stroke,
    "--svg-fill": colors.fill,
  } as CSSProperties;

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
      <div className="mdb-wrapper" data-reduced={prefersReducedMotion ? "" : undefined} style={ink}>
        <div className="mdb-line mdb-horizontal mdb-top" />
        <div className="mdb-line mdb-vertical mdb-right" />
        <div className="mdb-line mdb-horizontal mdb-bottom" />
        <div className="mdb-line mdb-vertical mdb-left" />
        <div className="mdb-dot mdb-top mdb-left" />
        <div className="mdb-dot mdb-top mdb-right" />
        <div className="mdb-dot mdb-bottom mdb-right" />
        <div className="mdb-dot mdb-bottom mdb-left" />
        <button type="button" className="mdb-btn" onClick={onClick}>
          <span>{label}</span>
          <svg
            className="mdb-svg"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M17.6744 11.4075L15.7691 17.1233C15.7072 17.309 15.5586 17.4529 15.3709 17.5087L3.69348 20.9803C3.22819 21.1186 2.79978 20.676 2.95328 20.2155L6.74467 8.84131C6.79981 8.67588 6.92419 8.54263 7.08543 8.47624L12.472 6.25822C12.696 6.166 12.9535 6.21749 13.1248 6.38876L17.5294 10.7935C17.6901 10.9542 17.7463 11.1919 17.6744 11.4075Z" />
            <path d="M3.2959 20.6016L9.65986 14.2376" />
            <path d="M17.7917 11.0557L20.6202 8.22724C21.4012 7.44619 21.4012 6.17986 20.6202 5.39881L18.4989 3.27749C17.7178 2.49645 16.4515 2.49645 15.6704 3.27749L12.842 6.10592" />
            <path d="M11.7814 12.1163C11.1956 11.5305 10.2458 11.5305 9.66004 12.1163C9.07426 12.7021 9.07426 13.6519 9.66004 14.2376C10.2458 14.8234 11.1956 14.8234 11.7814 14.2376C12.3671 13.6519 12.3671 12.7021 11.7814 12.1163Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
