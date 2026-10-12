"use client";
// Ported from ThreeUI Community's Gradient Pill Button (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SatinCapsuleProps {
  label?: string;
  /** Small mono annotation after the label; pass an empty string to hide it. */
  meta?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

// A hairline drawn by a masked ::before, graded from the theme ink.
const BORDER_STYLE = `
.msc-button::before {
  content: ""; position: absolute; inset: 0; padding: 1px; border-radius: inherit;
  -webkit-mask: linear-gradient(white 0 0) content-box, linear-gradient(white 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  background: linear-gradient(180deg, hsl(var(--foreground) / 0.35), hsl(var(--primary) / 0.05) 50%, hsl(var(--foreground) / 0.25));
  pointer-events: none;
}
`;

export function SatinCapsule({
  label = "Read the notes",
  meta = "04 min",
  onClick,
  className,
}: SatinCapsuleProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "msc-button group relative inline-flex items-center gap-3 rounded-full bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted))_50%,hsl(var(--card)))] py-2.5 pl-6 pr-2.5 text-sm text-foreground shadow-[0_18px_34px_-16px_hsl(var(--foreground)/0.45),inset_0_1px_0_hsl(var(--background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !prefersReducedMotion &&
          "transition-shadow duration-300 hover:shadow-[0_22px_40px_-14px_hsl(var(--primary)/0.5),inset_0_1px_0_hsl(var(--background))]",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: BORDER_STYLE }} />
      <span className="font-sans tracking-tight">{label}</span>
      {meta ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {meta}
        </span>
      ) : null}
      <span
        aria-hidden
        className={cn(
          "grid h-7 w-7 place-items-center rounded-full bg-[hsl(var(--primary))] text-primary-foreground",
          !prefersReducedMotion && "transition-transform duration-300 group-hover:translate-x-0.5",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </button>
  );
}
