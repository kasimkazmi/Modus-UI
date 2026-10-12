"use client";
// Like pill: the mark pops with a ring of dots and the count rolls to its new value.

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const MARKS = {
  star: "M12 2.8l2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.1l-5.62 2.97 1.07-6.27L2.9 9.4l6.3-.9z",
  heart:
    "M12 20.5s-7.5-4.6-9.2-9.3C1.7 8 3.6 4.5 7.1 4.5c2 0 3.4 1.1 4.9 2.9 1.5-1.8 2.9-2.9 4.9-2.9 3.5 0 5.4 3.5 4.3 6.7-1.7 4.7-9.2 9.3-9.2 9.3z",
};

export interface BeatMarkProps {
  liked?: boolean;
  defaultLiked?: boolean;
  count?: number;
  onChange?: (liked: boolean) => void;
  showCount?: boolean;
  icon?: keyof typeof MARKS;
  idleOutline?: boolean;
  size?: number;
  corner?: number;
  likedColor?: string;
  idleColor?: string;
  pillColor?: string;
  textColor?: string;
  duration?: number;
  dotSize?: number;
  overshoot?: number;
  beat?: number;
  rollDuration?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function BeatMark({
  liked,
  defaultLiked = false,
  count = 128,
  onChange,
  showCount = true,
  icon = "star",
  idleOutline = true,
  size = 40,
  corner = 10,
  likedColor = "hsl(var(--primary))",
  idleColor = "hsl(var(--muted-foreground))",
  pillColor = "hsl(var(--muted))",
  textColor = "hsl(var(--foreground))",
  duration = 560,
  dotSize = 0.3,
  overshoot = 1.7,
  beat = 3,
  rollDuration = 350,
  disabled = false,
  label = "Like",
  className,
}: BeatMarkProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = useState(defaultLiked);
  const [pops, setPops] = useState(0);
  const on = liked ?? inner;
  const shown = count + (on ? 1 : 0);
  const glyph = size * 0.6;
  const dots = Math.max(1, Math.round(beat)) * 4;
  const seconds = duration / 1000;

  const toggle = () => {
    const next = !on;
    if (liked === undefined) setInner(next);
    if (next) setPops((n) => n + 1);
    onChange?.(next);
  };

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "inline-flex select-none items-center gap-2 pr-3 font-mono text-sm font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50",
        className,
      )}
      style={{
        height: size + 10,
        paddingLeft: 5,
        borderRadius: corner,
        background: pillColor,
        color: textColor,
      }}
    >
      <span className="relative grid place-items-center" style={{ width: size, height: size }}>
        <AnimatePresence>
          {on && !reduce && (
            <span key={pops} className="pointer-events-none absolute inset-0">
              {Array.from({ length: dots }, (_, i) => {
                const a = (i / dots) * Math.PI * 2;
                const r = size * (i % 2 ? 0.62 : 0.78);
                return (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2 rounded-full"
                    style={{
                      width: glyph * dotSize,
                      height: glyph * dotSize,
                      marginLeft: (-glyph * dotSize) / 2,
                      marginTop: (-glyph * dotSize) / 2,
                      background: likedColor,
                    }}
                    initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
                    animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r, scale: 0, opacity: 0 }}
                    transition={{ duration: seconds, ease: [0.2, 0.7, 0.3, 1] }}
                  />
                );
              })}
            </span>
          )}
        </AnimatePresence>
        <motion.svg
          key={on ? `on-${pops}` : "off"}
          viewBox="0 0 24 24"
          width={glyph}
          height={glyph}
          initial={on && !reduce ? { scale: 0.4 } : false}
          animate={{ scale: [0.4, 1 + (overshoot - 1) * 0.35, 1] }}
          transition={{ duration: reduce ? 0 : seconds * 0.8, times: [0, 0.45, 1] }}
        >
          <path
            d={MARKS[icon]}
            fill={on ? likedColor : idleOutline ? "none" : idleColor}
            stroke={on ? likedColor : idleColor}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </motion.svg>
      </span>
      {showCount && (
        <span className="relative inline-flex overflow-hidden" aria-live="polite">
          <AnimatePresence initial={false} mode="popLayout" custom={on}>
            <motion.span
              key={shown}
              custom={on}
              variants={{
                in: (up: boolean) => ({ y: up ? "100%" : "-100%", opacity: 0 }),
                rest: { y: 0, opacity: 1 },
                out: (up: boolean) => ({ y: up ? "-100%" : "100%", opacity: 0 }),
              }}
              initial="in"
              animate="rest"
              exit="out"
              transition={{ duration: reduce ? 0 : rollDuration / 1000, ease: [0.3, 0, 0.2, 1] }}
            >
              {shown}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
    </button>
  );
}
