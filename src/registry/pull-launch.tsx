"use client";
// A send pad you pull back like a slingshot; releasing past the arm point fires it.

import { useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export interface PullLaunchProps {
  children?: ReactNode;
  onSend?: () => void;
  padColor?: string;
  iconColor?: string;
  accentColor?: string;
  wellColor?: string;
  bandColor?: string;
  size?: number;
  strokeWidth?: number;
  armAt?: number;
  maxPull?: number;
  launchSpeed?: number;
  recoil?: number;
  flight?: number;
  particles?: number;
  spread?: number;
  axis?: "any" | "x" | "y";
  tapSends?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

interface Burst {
  key: number;
  angle: number; // radians, direction of travel
}

export function PullLaunch({
  children,
  onSend,
  padColor = "hsl(var(--primary))",
  iconColor = "hsl(var(--primary-foreground))",
  accentColor = "hsl(var(--primary))",
  wellColor = "hsl(var(--muted))",
  bandColor = "hsl(var(--muted-foreground))",
  size = 56,
  strokeWidth = 3,
  armAt = 48,
  maxPull = 160,
  launchSpeed = 2600,
  recoil = 0.2,
  flight = 120,
  particles = 14,
  spread = 60,
  axis = "any",
  tapSends = true,
  disabled = false,
  ariaLabel = "Send",
  className,
}: PullLaunchProps) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dist = useTransform([x, y], ([a, b]: number[]) => Math.hypot(a, b));
  const bandOpacity = useTransform(dist, [0, 6], [0, 1]);
  const bandX = useTransform(x, (v) => size * 1.1 + v);
  const bandY = useTransform(y, (v) => size * 1.1 + v);
  const [burst, setBurst] = useState<Burst | null>(null);
  const flying = useRef(false);
  const box = size * 2.2;
  const c = box / 2;

  const home = () =>
    Promise.all([
      animate(x, 0, { type: "spring", bounce: recoil, duration: 0.5 }),
      animate(y, 0, { type: "spring", bounce: recoil, duration: 0.5 }),
    ]);

  const fire = async (angle: number) => {
    if (disabled || flying.current) return;
    flying.current = true;
    onSend?.();
    setBurst({ key: Date.now(), angle });
    if (!reduce) {
      const t = Math.max(0.08, (flight + Math.hypot(x.get(), y.get())) / launchSpeed);
      await Promise.all([
        animate(x, Math.cos(angle) * flight, { duration: t, ease: "easeIn" }),
        animate(y, Math.sin(angle) * flight, { duration: t, ease: "easeIn" }),
      ]);
      x.jump(0);
      y.jump(0);
    } else {
      await home();
    }
    flying.current = false;
  };

  const release = () => {
    const d = Math.hypot(x.get(), y.get());
    if (d >= armAt) fire(Math.atan2(-y.get(), -x.get()));
    else home();
  };

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: box, height: box }}
    >
      <div
        className="absolute rounded-full"
        style={{ width: size * 1.3, height: size * 1.3, background: wellColor }}
      />
      <svg
        className="pointer-events-none absolute inset-0 overflow-visible"
        width={box}
        height={box}
      >
        <motion.line
          x1={c}
          y1={c}
          x2={bandX}
          y2={bandY}
          stroke={bandColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ opacity: bandOpacity }}
        />
      </svg>

      {burst &&
        Array.from({ length: particles }, (_, i) => {
          const a = burst.angle + ((i / Math.max(particles - 1, 1) - 0.5) * spread * Math.PI) / 180;
          const r = flight * (0.5 + ((i * 37) % 10) / 20);
          return (
            <motion.span
              key={`${burst.key}-${i}`}
              aria-hidden
              className="pointer-events-none absolute size-1.5 rounded-full"
              style={{ background: accentColor, left: c - 3, top: c - 3 }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={
                reduce
                  ? { opacity: 0 }
                  : { x: Math.cos(a) * r, y: Math.sin(a) * r, opacity: 0, scale: 0.3 }
              }
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          );
        })}

      <motion.button
        type="button"
        aria-label={ariaLabel}
        title="Press Enter to send, or drag away and release."
        disabled={disabled}
        drag={disabled ? false : axis === "any" ? true : axis}
        dragConstraints={{ left: -maxPull, right: maxPull, top: -maxPull, bottom: maxPull }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragEnd={release}
        onTap={() => tapSends && fire(-Math.PI / 2)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            fire(-Math.PI / 2);
          }
        }}
        whileTap={reduce ? undefined : { scale: 0.94 }}
        className="relative grid touch-none place-items-center shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:opacity-50"
        style={{
          x,
          y,
          width: size,
          height: size,
          borderRadius: size * 0.32,
          background: padColor,
          color: iconColor,
        }}
      >
        {children ?? <HugeiconsIcon icon={ArrowUp02Icon} size={size * 0.4} />}
      </motion.button>
    </div>
  );
}
