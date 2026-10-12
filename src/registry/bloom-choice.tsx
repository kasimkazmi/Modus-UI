"use client";
// Single-choice chip row: the picked chip swells on a spring and its neighbours lean away.

import { useRef, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type BloomItem = string | { value: string; label?: string; disabled?: boolean };

const DEFAULT_ITEMS: BloomItem[] = ["Draft", "Proof", "Press", "Print"];

const PAD = { sm: "h-7 px-3 text-[10px]", md: "h-9 px-4 text-xs", lg: "h-11 px-5 text-sm" };

export interface BloomChoiceProps {
  items?: BloomItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, index: number) => void;
  chipColor?: string;
  activeColor?: string;
  textColor?: string;
  activeTextColor?: string;
  size?: keyof typeof PAD;
  gap?: number;
  radius?: number;
  swell?: number;
  barge?: number;
  shrink?: number;
  jelly?: number;
  bounce?: number;
  stagger?: number;
  stiffness?: number;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function BloomChoice({
  items = DEFAULT_ITEMS,
  value,
  defaultValue,
  onChange,
  chipColor = "hsl(var(--muted))",
  activeColor = "hsl(var(--primary))",
  textColor = "hsl(var(--muted-foreground))",
  activeTextColor = "hsl(var(--primary-foreground))",
  size = "md",
  gap = 8,
  radius = 18,
  swell = 0.2,
  barge = 6,
  shrink = 0.05,
  jelly = 1,
  bounce = 0.25,
  stagger = 22,
  stiffness = 580,
  disabled = false,
  ariaLabel = "Options",
  className,
}: BloomChoiceProps) {
  const reduce = useReducedMotion();
  const options = items.map((it) => (typeof it === "string" ? { value: it } : it));
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const active = options.findIndex((o) => o.value === current);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  // Critical damping is 2√k; bounce (scaled by jelly) eases off from it.
  const damping = 2 * Math.sqrt(stiffness) * Math.max(0.08, 1 - bounce * jelly);

  const pick = (i: number) => {
    const o = options[i];
    if (disabled || !o || o.disabled) return;
    if (value === undefined) setInner(o.value);
    onChange?.(o.value, i);
    refs.current[i]?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    const from = active < 0 ? 0 : active;
    const n = options.length;
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? (from + 1) % n
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? (from - 1 + n) % n
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : -1;
    if (to < 0) return;
    e.preventDefault();
    pick(to);
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onKeyDown={onKey}
      className={cn("inline-flex flex-wrap items-center", disabled && "opacity-50", className)}
      style={{ gap }}
    >
      {options.map((o, i) => {
        const on = i === active;
        const d = active < 0 ? 0 : i - active;
        return (
          <motion.button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (active < 0 && i === 0) ? 0 : -1}
            disabled={disabled || o.disabled}
            onClick={() => pick(i)}
            className={cn(
              "relative shrink-0 font-mono uppercase tracking-[0.14em] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
              PAD[size],
            )}
            style={{ borderRadius: radius }}
            animate={{
              scale: on ? 1 + swell : d === 0 ? 1 : 1 - shrink / Math.abs(d),
              x: d === 0 ? 0 : (Math.sign(d) * barge) / Math.abs(d),
              backgroundColor: on ? activeColor : chipColor,
              color: on ? activeTextColor : textColor,
            }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    type: "spring",
                    stiffness,
                    damping,
                    delay: (Math.abs(d) * stagger) / 1000,
                    backgroundColor: { duration: 0.18 },
                    color: { duration: 0.18 },
                  }
            }
          >
            {o.label ?? o.value}
          </motion.button>
        );
      })}
    </div>
  );
}
