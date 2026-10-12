"use client";
// Ported from ThreeUI Community's Attune Thermal (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const STYLES = `
.m-kiln {
  --m-kiln-hot: color-mix(in oklab, hsl(var(--primary)) 55%, hsl(var(--destructive)));
  position: relative; display: inline-flex; align-items: center; gap: 14px; height: 54px; padding: 0 10px 0 24px;
  border: 0; border-radius: 999px; cursor: pointer; white-space: nowrap; color: hsl(var(--primary-foreground));
  background: linear-gradient(180deg, color-mix(in oklab, var(--m-kiln-hot) 80%, hsl(var(--primary-foreground))) 0%, var(--m-kiln-hot) 45%, hsl(var(--primary)) 100%);
  box-shadow: inset 0 1px hsl(var(--primary-foreground) / .3), 0 0 0 1px hsl(var(--primary) / .4), 0 14px 32px -10px var(--m-kiln-hot);
  transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
}
.m-kiln::before {
  content: ""; position: absolute; inset: -18px -30px; z-index: -1; border-radius: inherit; pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--m-kiln-hot) 35%, transparent), transparent);
}
.m-kiln-coal { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 999px; background: hsl(var(--primary-foreground) / .16); }
.m-kiln svg { width: 9px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.8; transition: transform .2s ease; }
.m-kiln:hover { transform: translateY(-2px); filter: brightness(1.08); box-shadow: inset 0 1px hsl(var(--primary-foreground) / .4), 0 0 0 1px hsl(var(--primary) / .4), 0 20px 40px -10px var(--m-kiln-hot); }
.m-kiln:hover svg { transform: translateX(2px); }
.m-kiln:active { transform: translateY(1px); }
.m-kiln:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 5px; }
.m-kiln[data-reduced], .m-kiln[data-reduced] svg { transition-duration: .01ms !important; }
`;

export interface KilnButtonProps {
  label?: string;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function KilnButton({
  label = "Fire it up",
  type = "button",
  onClick,
  className,
}: KilnButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button
        className={cn("m-kiln font-mono text-xs uppercase tracking-[0.2em]", className)}
        data-reduced={prefersReducedMotion ? "" : undefined}
        type={type}
        onClick={onClick}
      >
        <span>{label}</span>
        <span className="m-kiln-coal">
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 1.5 8 6 3 10.5" />
          </svg>
        </span>
      </button>
    </>
  );
}
