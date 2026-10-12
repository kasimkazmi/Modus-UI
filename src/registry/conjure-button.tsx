"use client";
// Ported from ThreeUI Community's Generate Button (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ConjureButtonProps {
  label?: string;
  activeLabel?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const STYLES = `
.mcj-wrap { position: relative; display: inline-block; isolation: isolate; }
.mcj {
  --r: 14px; --pad: 5px; --t: .4s; --glow: hsl(var(--primary));
  position: relative; display: flex; align-items: center; gap: .6rem; padding: .7rem 1.3rem; user-select: none;
  border: 1px solid hsl(var(--border)); border-radius: var(--r); cursor: pointer; outline: none;
  color: hsl(var(--foreground)); background: hsl(var(--card));
  box-shadow: inset 0 1px 1px hsl(var(--background) / .6), inset 0 6px 10px hsl(var(--background) / .35),
    0 -2px 4px hsl(var(--foreground) / .04), 0 12px 24px -12px hsl(var(--foreground) / .35);
  transition: box-shadow var(--t), border-color var(--t), background-color var(--t);
}
.mcj::before {
  content: ""; position: absolute; inset: calc(var(--pad) * -1); z-index: -1; pointer-events: none;
  border-radius: calc(var(--r) + var(--pad)); background: hsl(var(--muted));
  box-shadow: inset 1px 1px 1px hsl(var(--background) / .7), inset -1px -1px 2px hsl(var(--foreground) / .08);
  transition: box-shadow var(--t);
}
.mcj::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0;
  background: linear-gradient(0deg, hsl(var(--primary) / .55), hsl(var(--primary) / .15) 45%, transparent);
  transition: opacity var(--t);
}
.mcj-letter { position: relative; display: inline-block; color: hsl(var(--muted-foreground)); animation: mcj-letter 2.4s ease-in-out infinite; }
@keyframes mcj-letter { 50% { color: hsl(var(--foreground)); text-shadow: 0 0 6px hsl(var(--primary) / .45); } }
.mcj-svg { position: relative; z-index: 1; width: 20px; height: 20px; fill: hsl(var(--primary)); animation: mcj-flicker 2s linear .5s infinite; transition: transform var(--t); }
@keyframes mcj-flicker { 50% { opacity: .35; } }
.mcj-txt { position: relative; z-index: 1; display: flex; align-items: center; min-width: 6.6em; height: 1.5em; }
.mcj-t1, .mcj-t2 { position: absolute; white-space: nowrap; }
.mcj-t2 { opacity: 0; }
.mcj:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 7px; }
.mcj:focus .mcj-t1 { animation: mcj-out .3s ease-in-out 1s forwards; }
.mcj:focus .mcj-t2 { animation: mcj-out .3s ease-in-out 1s reverse forwards; }
@keyframes mcj-out { 0% { opacity: 1; } 100% { opacity: 0; } }
.mcj:focus .mcj-letter { animation: mcj-focus 1s ease-in-out forwards, mcj-letter 1.2s ease-in-out infinite; }
@keyframes mcj-focus { 0%, 100% { filter: blur(0); } 50% { transform: scale(1.8); filter: blur(8px) drop-shadow(-30px 10px 10px hsl(var(--primary))); } }
.mcj:hover { border-color: hsl(var(--primary) / .5); }
.mcj:hover::after, .mcj:focus::after { opacity: .5; }
.mcj:hover .mcj-svg { animation: none; transform: rotate(-14deg) scale(1.1); filter: drop-shadow(0 0 4px hsl(var(--primary) / .6)); }
.mcj:active { border-color: hsl(var(--primary)); }
.mcj:active::after { opacity: 1; }
.mcj:active .mcj-letter { animation: none; color: hsl(var(--foreground)); }
.mcj[data-reduced], .mcj[data-reduced] *, .mcj[data-reduced]::before, .mcj[data-reduced]::after { animation: none !important; transition: none !important; }
`;

function Letters({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="mcj-letter" style={{ animationDelay: `${i * 0.08}s` }}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}

export function ConjureButton({
  label = "Compose",
  activeLabel = "Composing",
  onClick,
  className,
}: ConjureButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className={cn("mcj-wrap", className)}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={onClick}
        data-reduced={prefersReducedMotion ? "" : undefined}
        className="mcj font-serif text-xl"
      >
        <svg className="mcj-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.5l1.6 5.2a3 3 0 0 0 2 2l5.2 1.6-5.2 1.6a3 3 0 0 0-2 2L12 20.1l-1.6-5.2a3 3 0 0 0-2-2L3.2 11.3l5.2-1.6a3 3 0 0 0 2-2L12 2.5Z" />
          <circle cx="19.5" cy="4.5" r="1.5" />
        </svg>
        <span className="mcj-txt">
          <span className="mcj-t1">
            <Letters text={label} />
          </span>
          <span className="mcj-t2">
            <Letters text={activeLabel} />
          </span>
        </span>
      </button>
    </div>
  );
}
