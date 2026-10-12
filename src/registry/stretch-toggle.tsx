"use client";
// Segmented control whose thumb stretches along its path and squashes as it travels.

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useSpring, useTransform, useVelocity } from "framer-motion";
import { cn } from "@/lib/utils";

interface StretchToggleProps {
  items: string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  trackColor?: string;
  thumbColor?: string;
  textColor?: string;
  activeTextColor?: string;
  size?: "sm" | "md" | "lg";
  radius?: number;
  inset?: number;
  equalSlots?: boolean;
  /** How much the thumb lengthens with speed, in percent. */
  stretch?: number;
  /** How much it thins with speed, in percent. */
  squash?: number;
  speed?: number;
  /** Higher glides longer before settling (0–100). */
  glide?: number;
  draggable?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const SIZES = { sm: "h-8 px-3 text-[10px]", md: "h-10 px-4 text-xs", lg: "h-12 px-6 text-sm" };

export function StretchToggle({
  items,
  value,
  defaultValue,
  onChange,
  trackColor = "hsl(var(--muted))",
  thumbColor = "hsl(var(--background))",
  textColor = "hsl(var(--muted-foreground))",
  activeTextColor = "hsl(var(--foreground))",
  size = "md",
  radius = 6,
  inset = 3,
  equalSlots = true,
  stretch = 100,
  squash = 3,
  speed = 1,
  glide = 75,
  draggable = true,
  disabled = false,
  ariaLabel = "Toggle group",
  className,
}: StretchToggleProps) {
  const reduced = useReducedMotion();
  const [inner, setInner] = useState(defaultValue ?? items[0]);
  const current = value ?? inner;
  const slots = useRef<(HTMLButtonElement | null)[]>([]);
  const dragging = useRef(false);

  const spring = reduced
    ? { duration: 0 }
    : { stiffness: 380 * speed * speed, damping: 42 - glide * 0.3, mass: 1 };
  const x = useSpring(0, spring);
  const width = useSpring(0, spring);
  const pace = useTransform(useVelocity(x), (v) => Math.min(Math.abs(v) / 2000, 1));
  const scaleX = useTransform(pace, (p) => 1 + (p * stretch) / 200);
  const scaleY = useTransform(pace, (p) => 1 - (p * squash) / 10);

  const select = (next: string) => {
    if (disabled || next === current) return;
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  useLayoutEffect(() => {
    const el = slots.current[items.indexOf(current)];
    if (!el) return;
    if (width.get() === 0) {
      x.jump(el.offsetLeft);
      width.jump(el.offsetWidth);
    } else {
      x.set(el.offsetLeft);
      width.set(el.offsetWidth);
    }
  }, [current, items, x, width, size, equalSlots]);

  const pick = (clientX: number) => {
    const hit = slots.current.findIndex((el) => {
      const r = el?.getBoundingClientRect();
      return r && clientX >= r.left && clientX <= r.right;
    });
    if (hit >= 0) select(items[hit]);
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={cn(
        "relative font-mono uppercase tracking-[0.16em]",
        equalSlots ? "inline-grid auto-cols-fr grid-flow-col" : "inline-flex",
        disabled && "opacity-50",
        className,
      )}
      style={{
        background: trackColor,
        borderRadius: radius + inset,
        padding: inset,
        touchAction: "pan-y",
      }}
      onPointerDown={() => draggable && (dragging.current = true)}
      onPointerMove={(e) => dragging.current && pick(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
      onKeyDown={(e) => {
        const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const i = (items.indexOf(current) + step + items.length) % items.length;
        select(items[i]);
        slots.current[i]?.focus();
      }}
    >
      <motion.span
        aria-hidden
        className="absolute left-0 shadow-sm"
        style={{
          top: inset,
          bottom: inset,
          x,
          width,
          scaleX,
          scaleY,
          background: thumbColor,
          borderRadius: radius,
        }}
      />
      {items.map((item, i) => (
        <button
          key={item}
          ref={(el) => {
            slots.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={item === current}
          tabIndex={item === current ? 0 : -1}
          disabled={disabled}
          onClick={() => select(item)}
          className={cn(
            "relative z-10 whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
            SIZES[size],
          )}
          style={{ color: item === current ? activeTextColor : textColor, borderRadius: radius }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
