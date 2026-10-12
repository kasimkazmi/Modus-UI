"use client";
// Ported from ThreeUI Community's Understory Arrow Pill (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface UnderstoryArrowPillProps {
  /** Button text. */
  label?: string;
  /** Ground the button is toned for. */
  mode?: "dark" | "light";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const STYLES = `
.m-understory-arrow-pill {
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
.m-understory-arrow-pill::before { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.m-understory-arrow-pill .m-btn {
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
.m-understory-arrow-pill .m-btn:focus-visible { outline: 2px solid var(--m-ink); outline-offset: 5px; }
.m-understory-arrow-pill .m-disc { display: grid; width: 32px; height: 32px; flex: none; place-items: center; border-radius: 50%; }
.m-understory-arrow-pill .m-btn svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 2; transition: transform .3s ease; }
.m-understory-arrow-pill .m-btn:hover { transform: translateY(-2px); }
.m-understory-arrow-pill .m-btn:hover svg { transform: translateX(2px); }

.m-understory-arrow-pill { --m-ink: #27222d; background: #f2efe7; color: #27222d; }
.m-understory-arrow-pill .m-btn { background: #9b78d0; color: #fff; box-shadow: 0 14px 30px rgba(82, 53, 112, .18); }
.m-understory-arrow-pill .m-disc { background: #f6f3ed; color: #9b78d0; }
.m-understory-arrow-pill .m-btn:hover { background: #8d69c5; }
.m-understory-arrow-pill[data-mode="dark"] { --m-ink: #ece7e0; background: #17141b; color: #ece7e0; }
.m-understory-arrow-pill[data-mode="dark"]::before { background: radial-gradient(circle at 50% 50%, rgba(155, 120, 208, .16), transparent 34%); }
.m-understory-arrow-pill[data-mode="dark"] .m-btn { background: #a482d9; box-shadow: 0 16px 34px rgba(0, 0, 0, .5); }
.m-understory-arrow-pill[data-mode="dark"] .m-btn:hover { background: #b08fe2; }
.m- .m-btn, .m- .m-btn svg { transition-duration: .01ms !important; }
`;

export function UnderstoryArrowPill({
  label = "Begin",
  mode = "dark",
  onClick,
  className,
}: UnderstoryArrowPillProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div
      className={cn("m-understory-arrow-pill", className)}
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
