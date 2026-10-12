"use client";
// Ported from ThreeUI Community's Circle Buttons (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface RoundGlyphProps {
  /** Raised plus key, frosted play disc with an orbiting sheen, or stitched mail ring. */
  variant?: "plus" | "play" | "mail";
  /** Accessible label. Defaults to "Add", "Play" or "Send mail". */
  ariaLabel?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const LABELS = { play: "Play", plus: "Add", mail: "Send mail" } as const;

const STYLES = `
.mrg { position: relative; display: grid; width: 68px; aspect-ratio: 1; place-items: center; padding: 0; border: 0; border-radius: 50%;
  background: transparent; color: hsl(var(--foreground)); cursor: pointer; transition: transform .2s ease-in-out; -webkit-tap-highlight-color: transparent; }
.mrg:disabled { cursor: not-allowed; opacity: .45; }
.mrg:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 7px; }
.mrg > span { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; }
.mrg-icon { z-index: 5; display: grid; place-items: center; }
.mrg-icon svg { width: 32%; height: 32%; overflow: visible; }

/* plus: a raised ink key with a pressed lip */
.mrg[data-v="plus"] { color: hsl(var(--primary-foreground)); }
.mrg[data-v="plus"] .mrg-face {
  background: radial-gradient(80% 80% at 35% 25%, color-mix(in oklab, hsl(var(--primary)) 70%, hsl(var(--primary-foreground))), hsl(var(--primary)));
  box-shadow: 0 0 0 1px hsl(var(--primary) / .4), 0 5px 0 color-mix(in oklab, hsl(var(--primary)) 65%, black), 0 14px 22px -8px hsl(var(--primary) / .7);
  transition: box-shadow .15s;
}
.mrg[data-v="plus"] .mrg-aura { inset: -10px; background: hsl(var(--primary) / .18); filter: blur(10px); opacity: .5; transition: opacity .4s; }
.mrg[data-v="plus"] svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-width: 1.8; transition: transform .3s ease; }
.mrg[data-v="plus"]:not(:disabled):hover .mrg-aura { opacity: 1; }
.mrg[data-v="plus"]:not(:disabled):hover svg { transform: rotate(90deg); }
.mrg[data-v="plus"]:not(:disabled):active { transform: translateY(3px); }
.mrg[data-v="plus"]:not(:disabled):active .mrg-face { box-shadow: 0 0 0 1px hsl(var(--primary) / .4), 0 2px 0 color-mix(in oklab, hsl(var(--primary)) 65%, black); }

/* play: frosted disc with a sheen orbiting inside */
.mrg[data-v="play"] { overflow: hidden; }
.mrg[data-v="play"] .mrg-face { background: hsl(var(--card) / .8); border: 1px solid hsl(var(--border)); box-shadow: inset 2px 4px 14px hsl(var(--foreground) / .06);
  backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); }
.mrg[data-v="play"] .mrg-aura { z-index: 3; inset: auto; top: 50%; left: 50%; width: 160px; height: 160px; border-radius: 50%;
  background: conic-gradient(from 180deg, transparent 200deg, hsl(var(--primary) / .35) 360deg); filter: blur(12px);
  transform: translate(-50%, -50%); animation: mrg-orbit 3.8s linear infinite; transition: opacity .5s; }
.mrg[data-v="play"] svg { margin-left: 4%; fill: currentColor; }
.mrg[data-v="play"]:not(:disabled):hover .mrg-face { background: hsl(var(--primary)); }
.mrg[data-v="play"]:not(:disabled):hover { color: hsl(var(--primary-foreground)); }
.mrg[data-v="play"]:not(:disabled):hover .mrg-aura { opacity: 0; }
.mrg[data-v="play"]:not(:disabled):active { transform: scale(.96); }
@keyframes mrg-orbit {
  0% { transform: translate(-50%, -50%) rotate(0); } 25% { transform: translate(calc(-50% - 24px), -50%) rotate(90deg); }
  50% { transform: translate(-50%, -50%) rotate(180deg); } 75% { transform: translate(calc(-50% + 24px), -50%) rotate(270deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

/* mail: a dashed ring that stitches closed on hover */
.mrg[data-v="mail"] { color: hsl(var(--muted-foreground)); }
.mrg[data-v="mail"] .mrg-face { border: 1px dashed hsl(var(--border)); background: hsl(var(--card)); transition: background-color .2s, border-color .2s; }
.mrg[data-v="mail"] .mrg-aura { inset: -8px; border: 1.5px dashed hsl(var(--primary)); opacity: 0; transform: rotate(-90deg) scale(.85);
  transition: opacity .3s, transform .6s cubic-bezier(.22,1,.36,1); }
.mrg[data-v="mail"] svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.mrg[data-v="mail"]:not(:disabled):hover { color: hsl(var(--primary-foreground)); transform: scale(1.05); }
.mrg[data-v="mail"]:not(:disabled):hover .mrg-face { background: hsl(var(--primary)); border-color: hsl(var(--primary)); }
.mrg[data-v="mail"]:not(:disabled):hover .mrg-aura { opacity: 1; transform: rotate(0) scale(1); }
.mrg[data-v="mail"]:not(:disabled):active { transform: scale(.97); }

.mrg[data-reduced], .mrg[data-reduced] *, .mrg[data-reduced] svg { animation: none !important; transition-duration: .01ms !important; }
`;

function Glyph({ variant }: { variant: "play" | "plus" | "mail" }) {
  if (variant === "play")
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M11.75 8.7c0-1.28 1.4-2.08 2.5-1.43l12 7.3a1.66 1.66 0 0 1 0 2.86l-12 7.3a1.66 1.66 0 0 1-2.5-1.43V8.7Z" />
      </svg>
    );
  if (variant === "plus")
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 7v18M7 16h18" />
      </svg>
    );
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="5.25" y="7.5" width="21.5" height="17" rx="3.25" />
      <path d="m7.25 10 7.35 5.72a2.26 2.26 0 0 0 2.8 0L24.75 10" />
    </svg>
  );
}

export function RoundGlyph({
  variant = "plus",
  ariaLabel,
  disabled = false,
  type = "button",
  onClick,
  className,
}: RoundGlyphProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button
        className={cn("mrg", className)}
        data-v={variant}
        data-reduced={prefersReducedMotion ? "" : undefined}
        type={type}
        aria-label={ariaLabel ?? LABELS[variant]}
        disabled={disabled}
        onClick={onClick}
      >
        <span className="mrg-aura" aria-hidden="true" />
        <span className="mrg-face" aria-hidden="true" />
        <span className="mrg-icon">
          <Glyph variant={variant} />
        </span>
      </button>
    </>
  );
}
