"use client";
// Subscribe toggle: switching on fills it with the theme ink and swings the bell in a decaying chime.

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "h-8 px-3 text-[10px] gap-2", bell: 14 },
  md: { box: "h-10 px-4 text-[11px] gap-2.5", bell: 16 },
  lg: { box: "h-12 px-5 text-xs gap-3", bell: 19 },
};

/** Swing angles that alternate sides and shrink toward rest. */
function chime(amplitude: number, passes: number, decay: number) {
  const n = Math.max(1, Math.round(passes));
  const angles = [0];
  for (let i = 0; i < n; i++)
    angles.push((i % 2 ? -1 : 1) * amplitude * Math.pow(1 - i / n, decay));
  angles.push(0);
  return angles;
}

export interface ChimeSwitchProps {
  offLabel?: string;
  onLabel?: string;
  icon?: ReactNode;
  label?: ReactNode;
  color?: string;
  background?: string;
  onColor?: string;
  onBackground?: string;
  size?: keyof typeof SIZES;
  radius?: number;
  ringAmplitude?: number;
  ringPasses?: number;
  ringDecay?: number;
  ringDuration?: number;
  ringPivot?: number;
  crossfadeMs?: number;
  revealBounce?: number;
  count?: number;
  badge?: boolean;
  badgeColor?: string;
  badgeTextColor?: string;
  waves?: boolean;
  clapper?: boolean;
  pressed?: boolean;
  defaultPressed?: boolean;
  onChange?: (pressed: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function ChimeSwitch({
  offLabel = "Keep me posted",
  onLabel = "On the list",
  icon,
  label,
  color = "hsl(var(--foreground))",
  background = "hsl(var(--muted))",
  onColor = "hsl(var(--primary-foreground))",
  onBackground = "hsl(var(--primary))",
  size = "md",
  radius = 8,
  ringAmplitude = 17,
  ringPasses = 5,
  ringDecay = 1,
  ringDuration = 820,
  ringPivot = 16,
  crossfadeMs = 200,
  revealBounce = 0,
  count = 3,
  badge = true,
  badgeColor = "hsl(var(--destructive))",
  badgeTextColor = "hsl(var(--destructive-foreground))",
  waves = true,
  clapper = true,
  pressed,
  defaultPressed = false,
  onChange,
  disabled = false,
  className,
}: ChimeSwitchProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = useState(defaultPressed);
  const [rings, setRings] = useState(0);
  const on = pressed ?? inner;
  const s = SIZES[size];
  const ringing = on && rings > 0 && !reduce;
  const angles = chime(ringAmplitude, ringPasses, ringDecay);
  const swing = { duration: ringDuration / 1000, ease: "easeInOut" as const };
  const fade = reduce ? 0 : crossfadeMs / 1000;
  const reveal = reduce
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.4, bounce: revealBounce };

  const toggle = () => {
    const next = !on;
    if (pressed === undefined) setInner(next);
    if (next) setRings((n) => n + 1);
    onChange?.(next);
  };

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={toggle}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      animate={{ backgroundColor: on ? onBackground : background, color: on ? onColor : color }}
      transition={{ duration: fade }}
      className={cn(
        "relative inline-flex select-none items-center font-mono uppercase tracking-[0.18em] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] disabled:opacity-50",
        s.box,
        className,
      )}
      style={{ borderRadius: radius }}
    >
      <span className="relative grid place-items-center" style={{ width: s.bell, height: s.bell }}>
        {waves && ringing && (
          <span key={rings} aria-hidden className="pointer-events-none absolute inset-0">
            {[-1, 1].map((side) => (
              <motion.span
                key={side}
                className="absolute top-1/2 h-2/3 w-1/3 -translate-y-1/2 rounded-full border-current"
                style={{
                  [side < 0 ? "right" : "left"]: "100%",
                  borderLeftWidth: side > 0 ? 1.5 : 0,
                  borderRightWidth: side < 0 ? 1.5 : 0,
                }}
                initial={{ opacity: 0.9, x: 0 }}
                animate={{ opacity: 0, x: side * s.bell * 0.4 }}
                transition={{ duration: ringDuration / 1000, ease: "easeOut" }}
              />
            ))}
          </span>
        )}
        {icon ?? (
          <motion.svg
            key={`bell-${rings}`}
            viewBox="0 0 24 24"
            width={s.bell}
            height={s.bell}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ originX: "50%", originY: `${ringPivot}%` }}
            initial={false}
            animate={ringing ? { rotate: angles } : { rotate: 0 }}
            transition={swing}
            aria-hidden
          >
            <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" />
            <path d="M12 3v2" />
            {clapper && (
              <motion.circle
                cx={12}
                cy={20.5}
                r={1.6}
                fill="currentColor"
                style={{ originX: "50%", originY: "0%" }}
                animate={ringing ? { x: angles.map((a) => -a / 12) } : { x: 0 }}
                transition={swing}
              />
            )}
          </motion.svg>
        )}
        <AnimatePresence>
          {badge && on && count > 0 && (
            <motion.span
              className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-semibold tracking-normal"
              style={{ background: badgeColor, color: badgeTextColor }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={reveal}
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {label ?? (
        <span className="relative grid">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={on ? "on" : "off"}
              className="col-start-1 row-start-1 whitespace-nowrap"
              initial={{ opacity: 0, y: reduce ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -6 }}
              transition={
                reveal.duration === 0 ? { duration: 0 } : { ...reveal, opacity: { duration: fade } }
              }
            >
              {on ? onLabel : offLabel}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
    </motion.button>
  );
}
