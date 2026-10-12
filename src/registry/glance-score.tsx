"use client";
// Rating row: marks rise toward the pointer and a mono tip names the hovered score.

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const SHAPES = {
  star: "M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z",
  heart: "M12 20.5S3 15 3 8.8A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 9 2.2C21 15 12 20.5 12 20.5z",
  circle: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
};

interface GlanceScoreProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Fires with the hovered score, or null when the pointer leaves. */
  onPreview?: (value: number | null) => void;
  count?: number;
  shape?: keyof typeof SHAPES;
  /** Custom mark; drawn in currentColor. Overrides `shape`. */
  icon?: ReactNode;
  labels?: string[];
  activeColor?: string;
  idleColor?: string;
  tipColor?: string;
  tipTextColor?: string;
  size?: number;
  lift?: number;
  magnify?: number;
  riseDuration?: number;
  popScale?: number;
  showTip?: boolean;
  allowClear?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function GlanceScore({
  value,
  defaultValue = 0,
  onChange,
  onPreview,
  count = 5,
  shape = "star",
  icon,
  labels = [],
  activeColor = "hsl(var(--primary))",
  idleColor = "hsl(var(--border))",
  tipColor = "hsl(var(--foreground))",
  tipTextColor = "hsl(var(--background))",
  size = 26,
  lift = 4,
  magnify = 1.25,
  riseDuration = 320,
  popScale = 1.3,
  showTip = true,
  allowClear = true,
  readOnly = false,
  disabled = false,
  ariaLabel = "Rating",
  className,
}: GlanceScoreProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = useState(defaultValue);
  const [hover, setHover] = useState<number | null>(null);
  const [popped, setPopped] = useState(0);
  const score = value ?? inner;
  const shown = hover ?? score;
  const locked = readOnly || disabled;

  const preview = (n: number | null) => {
    if (locked) return;
    setHover(n);
    onPreview?.(n);
  };
  const commit = (n: number) => {
    if (locked) return;
    const next = allowClear && n === score ? 0 : Math.max(0, Math.min(count, n));
    setInner(next);
    setPopped(next);
    onChange?.(next);
  };
  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (step) {
      e.preventDefault();
      const next = Math.max(0, Math.min(count, score + step));
      if (next !== score) commit(next);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      commit(e.key === "Home" ? 0 : count);
    }
  };

  const ease = { duration: reduce ? 0 : riseDuration / 1000, ease: [0.2, 0.9, 0.3, 1] as const };

  return (
    <div
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={count}
      aria-valuenow={score}
      aria-valuetext={labels[score - 1] ?? `${score} of ${count}`}
      aria-readonly={readOnly || undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={locked ? undefined : onKey}
      onPointerLeave={() => preview(null)}
      className={cn(
        "relative inline-flex items-end gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "opacity-50",
        className,
      )}
      style={{ paddingTop: lift * 2 }}
    >
      {Array.from({ length: count }, (_, i) => {
        const n = i + 1;
        // Neighbours of the hovered mark rise a little too, fading with distance.
        const near = hover === null ? 0 : Math.max(0, 1 - Math.abs(hover - n) / 2);
        return (
          <motion.button
            key={n}
            type="button"
            tabIndex={-1}
            aria-hidden
            disabled={locked}
            onPointerEnter={() => preview(n)}
            onClick={() => commit(n)}
            className={cn("relative block", locked ? "cursor-default" : "cursor-pointer")}
            style={{ width: size, height: size, color: n <= shown ? activeColor : idleColor }}
            animate={{ y: -lift * near, scale: 1 + (magnify - 1) * near }}
            transition={ease}
          >
            <motion.span
              key={popped === n ? `pop-${score}` : "rest"}
              className="block h-full w-full"
              initial={popped === n && !reduce ? { scale: popScale } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
            >
              {icon ?? (
                <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor">
                  <path d={SHAPES[shape]} />
                </svg>
              )}
            </motion.span>
            <AnimatePresence>
              {showTip && hover === n && labels[i] && (
                <motion.span
                  className="pointer-events-none absolute bottom-full left-1/2 mb-2 whitespace-nowrap rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]"
                  style={{ background: tipColor, color: tipTextColor, x: "-50%" }}
                  initial={{ opacity: 0, y: reduce ? 0 : 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.16 }}
                >
                  {labels[i]}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
