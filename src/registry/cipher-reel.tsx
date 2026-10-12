"use client";
// One-time code field: serif numerals drop into paper slots, which seal in a cascade on success.

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CipherReelProps {
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  status?: "idle" | "success" | "error";
  mask?: boolean;
  caret?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  accentColor?: string;
  inkColor?: string;
  slotColor?: string;
  digitColor?: string;
  dangerColor?: string;
  slotSize?: number;
  gap?: number;
  radius?: number;
  bounce?: number;
  settle?: number;
  rise?: number;
  cascade?: number;
  ariaLabel?: string;
  className?: string;
}

export function CipherReel({
  length = 6,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  status = "idle",
  mask = false,
  caret = true,
  disabled = false,
  autoFocus = false,
  accentColor = "hsl(var(--primary))",
  inkColor = "hsl(var(--foreground))",
  slotColor = "hsl(var(--muted))",
  digitColor = "hsl(var(--foreground))",
  dangerColor = "hsl(var(--destructive))",
  slotSize = 48,
  gap = 10,
  radius = 6,
  bounce = 0.2,
  settle = 0.3,
  rise = 8,
  cascade = 20,
  ariaLabel = "One-time code",
  className,
}: CipherReelProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const code = (value ?? inner).slice(0, length);

  const write = (raw: string) => {
    const next = raw.replace(/\D/g, "").slice(0, length);
    if (value === undefined) setInner(next);
    onChange?.(next);
    if (next.length === length && next !== code) onComplete?.(next);
  };

  const edge =
    status === "success" ? accentColor : status === "error" ? dangerColor : "transparent";

  return (
    <motion.label
      className={cn("relative inline-flex cursor-text", disabled && "opacity-50", className)}
      style={{ gap }}
      animate={status === "error" && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <input
        aria-label={ariaLabel}
        value={code}
        onChange={(e) => write(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={status === "error" || undefined}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
      {Array.from({ length }, (_, i) => {
        const ch = code[i];
        const active = focused && i === Math.min(code.length, length - 1);
        return (
          <motion.span
            key={i}
            aria-hidden
            className="relative grid place-items-center overflow-hidden font-serif tabular-nums"
            style={{
              width: slotSize,
              height: slotSize * 1.18,
              borderRadius: radius,
              background: slotColor,
              color: digitColor,
              fontSize: slotSize * 0.55,
              boxShadow: `inset 0 0 0 1.5px ${active ? inkColor : edge}`,
            }}
            animate={status === "success" && !reduce ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: settle, delay: (i * cascade) / 1000 }}
          >
            <AnimatePresence initial={false}>
              {ch && (
                <motion.span
                  key={ch + i}
                  className="absolute"
                  initial={reduce ? false : { y: -rise, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ type: "spring", duration: 0.35, bounce }}
                >
                  {mask ? "•" : ch}
                </motion.span>
              )}
            </AnimatePresence>
            {caret && active && !ch && (
              <motion.span
                className="absolute w-px"
                style={{ height: slotSize * 0.5, background: inkColor }}
                animate={reduce ? { opacity: 1 } : { opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            )}
          </motion.span>
        );
      })}
    </motion.label>
  );
}
