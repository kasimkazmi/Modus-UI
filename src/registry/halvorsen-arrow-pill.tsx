"use client";
// Ported from ThreeUI Community's Halvorsen Arrow Pill (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HalvorsenArrowPillProps {
  /** Button text. */
  label?: string;
  /** Ground the button is toned for. */
  mode?: "dark" | "light";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const STYLES = `
.m-halvorsen-arrow-pill {
  --m-ink: #fff;
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 240px;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
  font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.m-halvorsen-arrow-pill::before { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.m-halvorsen-arrow-pill .m-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  font: inherit;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  -webkit-font-smoothing: antialiased;
  gap: 18px;
  height: 54px;
  padding: 0 11px 0 36px;
  border-radius: 999px;
  font-size: 17px;
  letter-spacing: -.005em;
  transition: background .3s ease, transform .3s ease, color .3s ease;
}
.m-halvorsen-arrow-pill .m-btn:focus-visible { outline: 2px solid var(--m-ink); outline-offset: 5px; }
.m-halvorsen-arrow-pill .m-disc { display: grid; width: 32px; height: 32px; flex: none; place-items: center; border-radius: 50%; }
.m-halvorsen-arrow-pill .m-btn svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 2; transition: transform .3s ease; }
.m-halvorsen-arrow-pill .m-btn:hover { transform: translateY(-2px); }
.m-halvorsen-arrow-pill .m-btn:hover svg { transform: translateX(2px); }

.m-halvorsen-arrow-pill { background: #111113; color: #fff; }
.m-halvorsen-arrow-pill::before { background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, .06), transparent 35%); }
.m-halvorsen-arrow-pill .m-btn { background: #f0eee7; color: #111113; box-shadow: 0 14px 34px rgba(0, 0, 0, .32); }
.m-halvorsen-arrow-pill .m-disc { background: #111113; color: #f0eee7; }
.m-halvorsen-arrow-pill .m-btn:hover { background: #fff; }
.m-halvorsen-arrow-pill[data-mode="light"] { --m-ink: #14161a; background: #eeece5; }
.m-halvorsen-arrow-pill[data-mode="light"]::before { background: radial-gradient(circle at 50% 50%, rgba(17, 17, 19, .05), transparent 35%); }
.m-halvorsen-arrow-pill[data-mode="light"] .m-btn { background: #111113; box-shadow: 0 14px 30px rgba(17, 17, 19, .22); color: #f0eee7; }
.m-halvorsen-arrow-pill[data-mode="light"] .m-disc { background: #f0eee7; color: #111113; }
.m-halvorsen-arrow-pill[data-mode="light"] .m-btn:hover { background: #000; }
.m- .m-btn, .m- .m-btn svg { transition-duration: .01ms !important; }
`;

export function HalvorsenArrowPill({
  label = "See the work",
  mode = "dark",
  onClick,
  className,
}: HalvorsenArrowPillProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div
      className={cn("m-halvorsen-arrow-pill", className)}
      data-mode={mode}
      data-reduced={prefersReducedMotion ? "" : undefined}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button className="m-btn" type="button" onClick={onClick}>
        <span>{label}</span>
        <span className="m-disc">
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 1.5 8 6 3 10.5" />
          </svg>
        </span>
      </button>
    </div>
  );
}
