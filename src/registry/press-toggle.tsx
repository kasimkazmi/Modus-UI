"use client";
// A switch whose thumb squashes on press and stretches as it travels.

import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PressToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  trackColor?: string;
  trackOnColor?: string;
  thumbColor?: string;
  thumbOnColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  speed?: number;
  stretch?: number;
  hoverScale?: number;
  colorDuration?: number;
  ariaLabel?: string;
  id?: string;
  className?: string;
}

export function PressToggle({
  checked,
  defaultChecked = false,
  onChange,
  label = "Draft mode",
  disabled = false,
  trackColor = "hsl(var(--muted))",
  trackOnColor = "hsl(var(--primary))",
  thumbColor = "",
  thumbOnColor = "",
  width = 76,
  height = 38,
  radius = 10,
  speed = 50,
  stretch = 36,
  hoverScale = 1.035,
  colorDuration = 320,
  ariaLabel,
  id,
  className,
}: PressToggleProps) {
  const reduce = useReducedMotion();
  const autoId = useId();
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;

  const pad = 4;
  const thumb = height - pad * 2;
  const travel = width - thumb - pad * 2;

  const x = useMotionValue(on ? travel : 0);
  const press = useMotionValue(0); // 0 rest, 1 held
  // Stretch with distance from either end, squash while held.
  const scaleX = useTransform([x, press], ([v, p]: number[]) => {
    const mid = 1 - Math.abs((v / travel) * 2 - 1);
    return 1 + (mid * stretch) / 100 + p * 0.12;
  });
  const scaleY = useTransform(scaleX, (s) => 1 / Math.sqrt(s));
  const dragged = useRef(false);

  const settle = (next: boolean) => {
    const spring = { type: "spring" as const, stiffness: speed * 8, damping: 22 };
    animate(x, next ? travel : 0, reduce ? { duration: 0 } : spring);
    animate(press, 0, { duration: 0.15 });
  };

  useEffect(() => {
    settle(on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, travel]);

  const commit = (next: boolean) => {
    settle(next);
    if (next === on) return;
    setInner(next);
    onChange?.(next);
  };

  const fill = on ? trackOnColor : trackColor;
  const knob = on
    ? thumbOnColor || "hsl(var(--primary-foreground))"
    : thumbColor || "hsl(var(--foreground))";
  const fade = { duration: reduce ? 0 : colorDuration / 1000 };

  return (
    <label
      htmlFor={id ?? autoId}
      className={cn(
        "inline-flex items-center gap-3",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <motion.button
        id={id ?? autoId}
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (dragged.current) return;
          commit(!on);
        }}
        onPointerDown={() => {
          dragged.current = false;
          if (!disabled) animate(press, 1, { duration: reduce ? 0 : 0.12 });
        }}
        onPointerUp={() => !dragged.current && animate(press, 0, { duration: 0.15 })}
        whileHover={disabled || reduce ? undefined : { scale: hoverScale }}
        initial={false}
        animate={{ backgroundColor: fill }}
        transition={fade}
        className="relative shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]"
        style={{ width, height, borderRadius: radius, padding: pad }}
      >
        <motion.span
          drag={disabled ? false : "x"}
          dragConstraints={{ left: 0, right: travel }}
          dragElastic={0.08}
          dragMomentum={false}
          onDragStart={() => (dragged.current = true)}
          onDragEnd={() => commit(x.get() > travel / 2)}
          initial={false}
          animate={{ backgroundColor: knob }}
          transition={fade}
          className="block touch-none shadow-sm"
          style={{
            x,
            scaleX,
            scaleY,
            width: thumb,
            height: thumb,
            borderRadius: Math.max(radius - pad, 2),
            originX: on ? 1 : 0,
          }}
        />
      </motion.button>
      {label && (
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground">
          {label}
        </span>
      )}
    </label>
  );
}
