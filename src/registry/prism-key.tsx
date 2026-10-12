"use client";
// Ported from ThreeUI Community's Aster Glass (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PrismKeyProps {
  /** Glass key with an arrow chip, or a plain text key. */
  variant?: "arrow" | "plain";
  /** Button text. Defaults to "Open the kit" (arrow) or "Request access" (plain). */
  label?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const RIM = `
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
  mask: linear-gradient(black 0 0) content-box, linear-gradient(black 0 0); mask-composite: exclude;
  -webkit-mask: linear-gradient(black 0 0) content-box, linear-gradient(black 0 0); -webkit-mask-composite: xor;`;

const STYLES = `
.m-prism-key {
  position: relative; display: inline-flex; align-items: center; justify-content: center; height: 52px;
  border: 0; border-radius: 14px; isolation: isolate; cursor: pointer; white-space: nowrap;
  color: hsl(var(--foreground)); background: hsl(var(--foreground) / .045);
  box-shadow: 0 18px 40px -24px hsl(var(--primary) / .55), inset 0 1px 0 hsl(var(--background) / .6);
  backdrop-filter: blur(16px) saturate(1.3); -webkit-backdrop-filter: blur(16px) saturate(1.3);
  transition: transform .5s cubic-bezier(.22,1,.36,1), background .4s ease, box-shadow .5s cubic-bezier(.22,1,.36,1);
}
.m-prism-key::before {${RIM}
  z-index: -1;
  background: linear-gradient(148deg, hsl(var(--primary) / .7), hsl(var(--foreground) / .12) 36%, hsl(var(--foreground) / .04) 60%, hsl(var(--primary) / .45));
  transition: filter .45s cubic-bezier(.22,1,.36,1);
}
.m-prism-key::after {
  content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none;
  background: linear-gradient(180deg, hsl(var(--background) / .55), transparent 52%);
}
.m-prism-key:hover { transform: translateY(-2px); background: hsl(var(--primary) / .1); box-shadow: 0 14px 30px -14px hsl(var(--primary) / .6), inset 0 1px 0 hsl(var(--background) / .6); }
.m-prism-key:hover::before { filter: saturate(1.4) brightness(1.15); }
.m-prism-key:active { transform: translateY(0); }
.m-prism-key:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 5px; }
.m-prism-key-chip {
  position: relative; display: grid; width: 36px; height: 36px; place-items: center; border-radius: 10px;
  background: hsl(var(--primary)); color: hsl(var(--primary-foreground));
  box-shadow: inset 0 1px 0 hsl(var(--primary-foreground) / .35);
}
.m-prism-key svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transition: transform .5s cubic-bezier(.22,1,.36,1); }
.m-prism-key:hover svg { transform: translateX(2px) rotate(-45deg); }
.m-prism-key[data-reduced], .m-prism-key[data-reduced]::before, .m-prism-key[data-reduced] svg { transition-duration: .01ms !important; }
`;

export function PrismKey({ variant = "arrow", label, onClick, className }: PrismKeyProps) {
  const prefersReducedMotion = useReducedMotion();
  const arrow = variant === "arrow";
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button
        type="button"
        onClick={onClick}
        data-reduced={prefersReducedMotion ? "" : undefined}
        className={cn(
          "m-prism-key font-mono text-xs uppercase tracking-[0.18em]",
          arrow ? "gap-4 pl-6 pr-2" : "px-8",
          className,
        )}
      >
        <span>{label ?? (arrow ? "Open the kit" : "Request access")}</span>
        {arrow && (
          <span className="m-prism-key-chip">
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 6h8M6.6 2.6 10 6 6.6 9.4" />
            </svg>
          </span>
        )}
      </button>
    </>
  );
}
