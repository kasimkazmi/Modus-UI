"use client";
// Ported from ThreeUI Community's Launch Button (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface KeystrokeButtonProps {
  label?: string;
  /** Key legend printed in the corner of the cap. */
  keyHint?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function KeystrokeButton({
  label = "Commit changes",
  keyHint = "⌘ S",
  onClick,
  className,
}: KeystrokeButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/key relative rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute -inset-2 rounded-[16px] bg-[hsl(var(--primary)/0.25)] opacity-0 blur-lg group-hover/key:opacity-100",
          !prefersReducedMotion && "transition-opacity duration-500",
        )}
      />
      <span
        className={cn(
          "relative flex min-w-[220px] flex-col items-start gap-3 rounded-[12px] border border-[hsl(var(--border))] bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)))] px-5 pb-3.5 pt-3 text-left text-foreground shadow-[0_5px_0_hsl(var(--foreground)/0.75),0_14px_22px_-8px_hsl(var(--foreground)/0.4)] active:shadow-[0_2px_0_hsl(var(--foreground)/0.75),0_6px_10px_-6px_hsl(var(--foreground)/0.4)]",
          !prefersReducedMotion && "transition-all duration-150 active:translate-y-[3px]",
        )}
      >
        <span className="flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>{keyHint}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] shadow-[0_0_8px_hsl(var(--primary))]" />
        </span>
        <span className="font-serif text-xl leading-none">{label}</span>
      </span>
    </button>
  );
}
