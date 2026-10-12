"use client";
// Ported from ThreeUI Community's Meridian Keycap (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MeridianKeycapProps {
  /** Blue primary cap or graphite secondary cap. */
  variant?: "primary" | "secondary";
  /** Button text. Defaults to "Start free" (primary) or "Book a walkthrough" (secondary). */
  label?: string;
  /** Ground the keycap is toned for. */
  mode?: "dark" | "light";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const STYLES = `
.m-meridian-keycap {
  --m-ink: #fff;
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 240px;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
  background: #04070d;
  color: var(--m-ink);
  font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.m-meridian-keycap::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(circle at 50% 44%, rgba(77, 163, 255, .13), transparent 34%);
}
.m-meridian-keycap .m-btn {
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
  height: 62px;
  padding: 0 30px;
  border-radius: 15px;
  flex-shrink: 0;
  background: #0c1017;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .07);
}
.m-meridian-keycap .m-btn:focus-visible { outline: 2px solid var(--m-ink); outline-offset: 5px; }
.m-meridian-keycap .m-btn::before {
  content: "";
  position: absolute;
  inset: 3px 4px 9px;
  border-radius: 12px;
  background: linear-gradient(180deg, #2a3142, #1c2230);
  box-shadow: 0 5px 0 #080b11, 0 9px 15px -2px rgba(0, 0, 0, .62), inset 0 1px rgba(255, 255, 255, .11);
  transition: transform .13s cubic-bezier(.22, .61, .36, 1), box-shadow .13s cubic-bezier(.22, .61, .36, 1);
}
.m-meridian-keycap .m-btn > span:not(.m-led) {
  position: relative;
  z-index: 1;
  color: #dde5f2;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -.005em;
}
.m-meridian-keycap .m-led {
  position: absolute;
  z-index: 1;
  top: 12px;
  left: 50%;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .16);
  transform: translateX(-50%);
  transition: background .22s ease, box-shadow .22s ease;
}
.m-meridian-keycap .m-btn:hover::before { transform: translateY(4px); box-shadow: 0 1px 0 #080b11, 0 3px 8px -2px rgba(0, 0, 0, .55), inset 0 1px rgba(255, 255, 255, .11); }
.m-meridian-keycap .m-btn:hover .m-led { background: #4da3ff; box-shadow: 0 0 7px #4da3ff; }
.m-meridian-keycap .m-primary { background: #050f1c; box-shadow: inset 0 0 0 1px rgba(77, 163, 255, .22); }
.m-meridian-keycap .m-primary::before { background: linear-gradient(180deg, #6db6ff, #2e85e8); box-shadow: 0 5px 0 #0b4a86, 0 9px 18px -2px rgba(21, 88, 158, .5), inset 0 1px rgba(255, 255, 255, .5); }
.m-meridian-keycap .m-primary > span:not(.m-led) { color: #04182f; }
.m-meridian-keycap .m-primary .m-led { background: rgba(4, 24, 47, .3); }
.m-meridian-keycap .m-primary:hover::before { box-shadow: 0 1px 0 #0b4a86, 0 3px 10px -2px rgba(21, 88, 158, .45), inset 0 1px rgba(255, 255, 255, .5); }
.m-meridian-keycap .m-primary:hover .m-led { background: #04182f; box-shadow: 0 0 6px rgba(4, 24, 47, .55); }

.m-meridian-keycap[data-mode="light"] { background: #e9eef5; --m-ink: #04070d; }
.m-meridian-keycap[data-mode="light"]::before { background: radial-gradient(circle at 50% 44%, rgba(46, 133, 232, .2), transparent 34%); }
.m-meridian-keycap[data-mode="light"] .m-btn { background: #dfe5ee; box-shadow: inset 0 0 0 1px rgba(4, 7, 13, .09); }
.m-meridian-keycap[data-mode="light"] .m-btn::before { background: linear-gradient(180deg, #fbfcfe, #e3e8f1); box-shadow: 0 5px 0 #bcc5d3, 0 9px 15px -2px rgba(4, 7, 13, .2), inset 0 1px #fff; }
.m-meridian-keycap[data-mode="light"] .m-btn > span:not(.m-led) { color: #1d2532; }
.m-meridian-keycap[data-mode="light"] .m-btn .m-led { background: rgba(4, 7, 13, .18); }
.m-meridian-keycap[data-mode="light"] .m-btn:hover::before { box-shadow: 0 1px 0 #bcc5d3, 0 3px 8px -2px rgba(4, 7, 13, .18), inset 0 1px #fff; }
.m-meridian-keycap[data-mode="light"] .m-btn:hover .m-led { background: #2e85e8; box-shadow: 0 0 7px #2e85e8; }
.m-meridian-keycap[data-mode="light"] .m-primary { background: #dbe7f6; box-shadow: inset 0 0 0 1px rgba(46, 133, 232, .3); }
.m-meridian-keycap[data-mode="light"] .m-primary::before { background: linear-gradient(180deg, #6db6ff, #2e85e8); box-shadow: 0 5px 0 #1d6dc4, 0 9px 18px -2px rgba(21, 88, 158, .32), inset 0 1px rgba(255, 255, 255, .5); }
.m-meridian-keycap[data-mode="light"] .m-primary > span:not(.m-led) { color: #04182f; }
.m-meridian-keycap[data-mode="light"] .m-primary .m-led { background: rgba(4, 24, 47, .3); }
.m-meridian-keycap[data-mode="light"] .m-primary:hover::before { box-shadow: 0 1px 0 #1d6dc4, 0 3px 10px -2px rgba(21, 88, 158, .3), inset 0 1px rgba(255, 255, 255, .5); }
.m-meridian-keycap[data-mode="light"] .m-primary:hover .m-led { background: #04182f; box-shadow: 0 0 6px rgba(4, 24, 47, .55); }
.m-meridian-keycap[data-reduced] .m-btn, .m-meridian-keycap[data-reduced] .m-btn::before, .m-meridian-keycap[data-reduced] .m-led { transition-duration: .01ms !important; }
`;

export function MeridianKeycap({
  variant = "primary",
  label,
  mode = "dark",
  onClick,
  className,
}: MeridianKeycapProps) {
  const prefersReducedMotion = useReducedMotion();
  const primary = variant !== "secondary";
  return (
    <div
      className={cn("m-meridian-keycap", className)}
      data-mode={mode}
      data-reduced={prefersReducedMotion ? "" : undefined}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button className={cn("m-btn", primary && "m-primary")} type="button" onClick={onClick}>
        <span className="m-led" />
        <span>{label ?? (primary ? "Start free" : "Book a walkthrough")}</span>
      </button>
    </div>
  );
}
