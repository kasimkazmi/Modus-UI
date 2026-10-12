"use client";
// Checkbox whose box springs full of colour and strikes through its serif label.

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TallyBoxProps {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  color?: string;
  fillColor?: string;
  checkColor?: string;
  boxSize?: number;
  boxRadius?: number;
  fontSize?: number;
  bounce?: number;
  /** Seconds the strike waits after the box fills. */
  strikeLag?: number;
  doneOpacity?: number;
  /** Where the strike line grows from: "left", "right" or "center". */
  strike?: "left" | "right" | "center";
  ariaLabel?: string;
  className?: string;
}

export function TallyBox({
  label = "Proof the galleys",
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  color = "hsl(var(--foreground))",
  fillColor = "hsl(var(--primary))",
  checkColor = "hsl(var(--primary-foreground))",
  boxSize = 28,
  boxRadius = 4,
  fontSize = 20,
  bounce = 0.2,
  strikeLag = 0.12,
  doneOpacity = 0.42,
  strike = "left",
  ariaLabel,
  className,
}: TallyBoxProps) {
  const reduced = useReducedMotion();
  const id = useId();
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const spring = reduced ? { duration: 0 } : { type: "spring" as const, duration: 0.45, bounce };
  const origin = strike === "right" ? 1 : strike === "center" ? 0.5 : 0;

  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInner(!on);
    onChange?.(!on);
  };

  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex cursor-pointer select-none items-center gap-3 font-serif",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      style={{ color, fontSize }}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={on}
        disabled={disabled}
        onChange={toggle}
        aria-label={ariaLabel}
      />
      <span
        aria-hidden
        className="relative grid shrink-0 place-items-center overflow-hidden border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-[hsl(var(--ring))] peer-focus-visible:ring-offset-2"
        style={{
          width: boxSize,
          height: boxSize * 0.94,
          borderRadius: boxRadius,
          borderColor: fillColor,
        }}
      >
        <motion.span
          className="absolute inset-0"
          style={{ background: fillColor }}
          initial={false}
          animate={{ scale: on ? 1 : 0 }}
          transition={spring}
        />
        <svg
          className="relative"
          width="62%"
          height="62%"
          viewBox="0 0 24 24"
          fill="none"
          stroke={checkColor}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M4 12.5l5 5L20 6.5"
            initial={false}
            animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 0.25, delay: on && !reduced ? 0.08 : 0 }}
          />
        </svg>
      </span>
      <motion.span
        className="relative"
        initial={false}
        animate={{ opacity: on ? doneOpacity : 1 }}
        transition={{ duration: reduced ? 0 : 0.3, delay: on && !reduced ? strikeLag : 0 }}
      >
        {label}
        <motion.span
          aria-hidden
          className="absolute inset-x-0 top-[55%] h-[2px]"
          style={{ background: "currentColor", originX: origin }}
          initial={false}
          animate={{ scaleX: on ? 1 : 0 }}
          transition={reduced ? { duration: 0 } : { ...spring, delay: on ? strikeLag : 0 }}
        />
      </motion.span>
    </label>
  );
}
