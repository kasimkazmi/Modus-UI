"use client";
// Ported from ThreeUI Community's Dot Border Button (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StitchFrameButtonProps {
  label?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

// On hover four pins travel to the corners and a stitched frame is sewn around the button, one edge at a time.
const STYLES = `
.msf-wrap {
  --pin: 7px; --speed: .32s; --ink: hsl(var(--primary));
  position: relative; display: inline-flex; padding: .9rem 1.1rem; isolation: isolate; user-select: none;
}
.msf-wrap::after {
  content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: 0;
  background-image: radial-gradient(hsl(var(--primary) / .28) 1px, transparent 1.2px); background-size: 6px 6px;
}
.msf-wrap:has(.msf-btn:hover)::after { animation: msf-fade calc(var(--speed) * 4) ease-in-out forwards; }
@keyframes msf-fade { 80% { opacity: 0; } 100% { opacity: 1; } }
.msf-btn {
  display: flex; align-items: center; gap: .6rem; padding: .7rem 1.4rem; white-space: nowrap; border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) - 2px); background: hsl(var(--card)); color: hsl(var(--foreground)); cursor: pointer;
  transition: transform .2s ease-in-out, background-color .2s ease-in-out, color .2s ease-in-out;
}
.msf-btn:hover { background: var(--ink); color: hsl(var(--primary-foreground)); transform: scale(1.04); }
.msf-btn:active { transform: scale(.98); }
.msf-btn:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 4px; }
.msf-svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; transition: transform .3s ease; }
.msf-btn:hover .msf-svg { transform: rotate(-12deg); }
.msf-pin { position: absolute; width: var(--pin); aspect-ratio: 1; border-radius: 999px; background: var(--ink); opacity: 0; }
.msf-wrap:has(.msf-btn:hover) .msf-pin.t.l { top: 50%; left: 20%; animation: msf-tl var(--speed) ease-in-out forwards; }
.msf-wrap:has(.msf-btn:hover) .msf-pin.t.r { top: 50%; right: 20%; animation: msf-tr var(--speed) ease-in-out forwards; animation-delay: calc(var(--speed) * .6); }
.msf-wrap:has(.msf-btn:hover) .msf-pin.b.r { bottom: 50%; right: 20%; animation: msf-br var(--speed) ease-in-out forwards; animation-delay: calc(var(--speed) * 1.2); }
.msf-wrap:has(.msf-btn:hover) .msf-pin.b.l { bottom: 50%; left: 20%; animation: msf-bl var(--speed) ease-in-out forwards; animation-delay: calc(var(--speed) * 1.8); }
@keyframes msf-tl { 100% { top: calc(var(--pin) * -.5); left: calc(var(--pin) * -.5); opacity: 1; } }
@keyframes msf-tr { 100% { top: calc(var(--pin) * -.5); right: calc(var(--pin) * -.5); opacity: 1; } }
@keyframes msf-br { 100% { bottom: calc(var(--pin) * -.5); right: calc(var(--pin) * -.5); opacity: 1; } }
@keyframes msf-bl { 100% { bottom: calc(var(--pin) * -.5); left: calc(var(--pin) * -.5); opacity: 1; } }
.msf-line { position: absolute; }
.msf-line.h { height: 1px; width: 100%; background-image: repeating-linear-gradient(90deg, transparent 0 3px, var(--ink) 3px 7px); }
.msf-line.v { width: 1px; height: 100%; background-image: repeating-linear-gradient(0deg, transparent 0 3px, var(--ink) 3px 7px); }
.msf-line.t { top: 0; transform-origin: left; transform: scaleX(0); }
.msf-line.b { bottom: 0; transform-origin: right; transform: scaleX(0); }
.msf-line.l { left: 0; transform-origin: bottom; transform: scaleY(0); }
.msf-line.r { right: 0; transform-origin: top; transform: scaleY(0); }
.msf-wrap:has(.msf-btn:hover) .msf-line.t { animation: msf-x var(--speed) ease-in-out forwards; animation-delay: calc(var(--speed) * .8); }
.msf-wrap:has(.msf-btn:hover) .msf-line.r { animation: msf-y var(--speed) ease-in-out forwards; animation-delay: calc(var(--speed) * 1.4); }
.msf-wrap:has(.msf-btn:hover) .msf-line.b { animation: msf-x var(--speed) ease-in-out forwards; animation-delay: calc(var(--speed) * 2); }
.msf-wrap:has(.msf-btn:hover) .msf-line.l { animation: msf-y var(--speed) ease-in-out forwards; animation-delay: calc(var(--speed) * 2.4); }
@keyframes msf-x { 100% { transform: scaleX(1); } }
@keyframes msf-y { 100% { transform: scaleY(1); } }
.msf-wrap[data-reduced] *, .msf-wrap[data-reduced]::after { animation-duration: .01ms !important; animation-delay: 0s !important; transition: none !important; }
.msf-wrap[data-reduced] .msf-btn:hover, .msf-wrap[data-reduced] .msf-btn:active { transform: none; }
`;

export function StitchFrameButton({
  label = "Start sketching",
  onClick,
  className,
}: StitchFrameButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className={cn("msf-wrap", className)} data-reduced={prefersReducedMotion ? "" : undefined}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="msf-line h t" />
      <div className="msf-line v r" />
      <div className="msf-line h b" />
      <div className="msf-line v l" />
      <div className="msf-pin t l" />
      <div className="msf-pin t r" />
      <div className="msf-pin b r" />
      <div className="msf-pin b l" />
      <button type="button" className="msf-btn font-serif text-xl italic" onClick={onClick}>
        <span>{label}</span>
        <svg className="msf-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
          <path d="M14 7l3 3" />
        </svg>
      </button>
    </div>
  );
}
