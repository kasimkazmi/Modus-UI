"use client";
// Ported from ThreeUI Community's Floating Dots CTA (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RisingMotesProps {
  label?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const MOTES: [string, number, number, number][] = [
  // left, opacity, duration (s), delay (s)
  ["8%", 0.9, 2.6, 0.3],
  ["19%", 0.6, 2.2, 1.1],
  ["31%", 0.8, 2.9, 0],
  ["42%", 0.5, 2.4, 0.7],
  ["53%", 1, 2.1, 0.2],
  ["61%", 0.6, 2.7, 1.4],
  ["72%", 0.9, 2.3, 0.5],
  ["81%", 0.7, 2.8, 0.9],
  ["90%", 0.8, 2.0, 0.1],
  ["96%", 0.5, 2.5, 1.6],
  ["14%", 0.7, 3.0, 1.9],
  ["67%", 0.6, 3.1, 2.2],
];

const STYLES = `
.mrm-btn {
  position: relative; display: inline-flex; align-items: center; justify-content: center; overflow: hidden;
  min-height: 52px; padding: 0 26px; border: 0; border-radius: calc(var(--radius) + 4px); cursor: pointer;
  color: hsl(var(--primary-foreground)); isolation: isolate;
  background: radial-gradient(70% 90% at 50% 120%, color-mix(in oklab, hsl(var(--primary)) 55%, hsl(var(--primary-foreground))) 0%, transparent 100%), hsl(var(--primary));
  box-shadow: 0 0 0 1px hsl(var(--primary) / .5), 0 16px 30px -16px hsl(var(--primary));
  transition: transform .25s ease, box-shadow .25s ease;
}
.mrm-btn::before {
  content: ""; position: absolute; inset: 1px; border-radius: inherit; pointer-events: none;
  background: linear-gradient(178deg, hsl(var(--primary-foreground) / .22), transparent 60%);
}
.mrm-btn:hover { transform: translateY(-1px); box-shadow: 0 0 0 1px hsl(var(--primary) / .5), 0 20px 38px -16px hsl(var(--primary)); }
.mrm-btn:active { transform: scale(.96); }
.mrm-btn:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 4px; }
.mrm-motes { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1; }
.mrm-mote { position: absolute; bottom: -6px; width: 3px; height: 3px; border-radius: 999px; background: hsl(var(--primary-foreground)); animation: mrm-rise infinite ease-in-out; }
@keyframes mrm-rise { 0% { transform: translateY(0) scale(1); } 85% { opacity: 0; } 100% { transform: translateY(-60px) scale(.4); opacity: 0; } }
${MOTES.map(
  ([left, opacity, duration, delay], index) =>
    `.mrm-mote:nth-child(${index + 1}) { left: ${left}; opacity: ${opacity}; animation-duration: ${duration}s; animation-delay: ${delay}s; }`,
).join("\n")}
.mrm-inner { position: relative; z-index: 2; display: inline-flex; align-items: center; gap: 10px; }
.mrm-icon { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; transition: transform .3s ease; }
.mrm-btn:hover .mrm-icon { transform: translateY(-3px); }
.mrm-btn[data-reduced], .mrm-btn[data-reduced] *, .mrm-btn[data-reduced]::before { animation: none !important; transition: none !important; }
.mrm-btn[data-reduced]:active, .mrm-btn[data-reduced]:hover .mrm-icon { transform: none; }
`;

export function RisingMotes({ label = "Subscribe", onClick, className }: RisingMotesProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button
        type="button"
        onClick={onClick}
        className={cn("mrm-btn font-mono text-xs uppercase tracking-[0.22em]", className)}
        data-reduced={prefersReducedMotion ? "" : undefined}
      >
        <span className="mrm-motes" aria-hidden="true">
          {MOTES.map((_, index) => (
            <i key={index} className="mrm-mote" />
          ))}
        </span>
        <span className="mrm-inner">
          {label}
          <svg className="mrm-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 19V5" />
            <path d="m6 11 6-6 6 6" />
          </svg>
        </span>
      </button>
    </>
  );
}
