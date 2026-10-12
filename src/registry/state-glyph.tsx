"use client";
// A small status ring (pending, running, done, failed, cancelled) with drawn marks and a mono label.

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Status = "pending" | "running" | "done" | "failed" | "cancelled";

interface StateGlyphProps {
  status?: Status;
  /** 0–1 while running; omit for an indeterminate spinner. */
  progress?: number;
  label?: React.ReactNode;
  color?: string;
  doneColor?: string;
  errorColor?: string;
  size?: number;
  strokeWidth?: number;
  dashes?: number;
  fontSize?: number;
  spinDuration?: number;
  arcLength?: number;
  drawDuration?: number;
  fillOpacity?: number;
  strike?: boolean;
  strikeDelay?: number;
  style?: React.CSSProperties;
  className?: string;
}

const R = 9; // ring radius in a 24-unit viewBox
const CIRC = 2 * Math.PI * R;

export function StateGlyph({
  status = "pending",
  progress,
  label,
  color = "hsl(var(--foreground))",
  doneColor = "hsl(var(--primary))",
  errorColor = "hsl(var(--destructive))",
  size = 20,
  strokeWidth = 2,
  dashes = 12,
  fontSize = 14,
  spinDuration = 1100,
  arcLength = 0.68,
  drawDuration = 240,
  fillOpacity = 0.14,
  strike = true,
  strikeDelay = 60,
  style,
  className,
}: StateGlyphProps) {
  const reduced = useReducedMotion();
  const tint = status === "done" ? doneColor : status === "failed" ? errorColor : color;
  const draw = { duration: reduced ? 0 : drawDuration / 1000, ease: "easeOut" as const };
  const sw = (strokeWidth * 24) / size;
  const determinate = typeof progress === "number";
  const closed = status === "done" || status === "failed" || status === "cancelled";
  const mark = (d: string, delay = 0) => (
    <motion.path
      key={d}
      d={d}
      fill="none"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ ...draw, delay: reduced ? 0 : delay }}
    />
  );

  return (
    <span
      role="status"
      aria-label={typeof label === "string" ? `${label}: ${status}` : status}
      className={cn(
        "inline-flex items-center gap-2 font-mono uppercase tracking-[0.14em]",
        className,
      )}
      style={{
        fontSize,
        color: status === "pending" ? "hsl(var(--muted-foreground))" : color,
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        stroke={tint}
        strokeWidth={sw}
        aria-hidden
      >
        {status === "pending" && (
          <circle
            cx={12}
            cy={12}
            r={R}
            fill="none"
            strokeDasharray={`${CIRC / dashes / 2} ${CIRC / dashes / 2}`}
            opacity={0.6}
          />
        )}
        {status === "running" &&
          (determinate ? (
            <>
              <circle cx={12} cy={12} r={R} fill="none" opacity={0.2} />
              <motion.circle
                cx={12}
                cy={12}
                r={R}
                fill="none"
                strokeLinecap="round"
                transform="rotate(-90 12 12)"
                animate={{ pathLength: Math.min(1, Math.max(0, progress)) }}
                transition={draw}
              />
            </>
          ) : (
            <motion.circle
              cx={12}
              cy={12}
              r={R}
              fill="none"
              strokeLinecap="round"
              style={{ originX: "50%", originY: "50%" }}
              initial={{ pathLength: arcLength }}
              animate={reduced ? {} : { rotate: 360 }}
              transition={{ duration: spinDuration / 1000, ease: "linear", repeat: Infinity }}
            />
          ))}
        {closed && (
          <>
            <motion.circle
              cx={12}
              cy={12}
              r={R}
              fill={tint}
              fillOpacity={fillOpacity}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={draw}
            />
            {status === "done" && mark("M8 12.5l2.7 2.7L16 9.5", drawDuration / 1000)}
            {status === "failed" && [
              mark("M9 9l6 6", drawDuration / 1000),
              mark("M15 9l-6 6", drawDuration / 700),
            ]}
            {status === "cancelled" && mark("M8.5 12h7", drawDuration / 1000)}
          </>
        )}
      </svg>
      {label != null && (
        <span className="relative">
          {label}
          {strike && status === "done" && (
            <motion.span
              aria-hidden
              className="absolute inset-x-0 top-1/2 h-px origin-left"
              style={{ background: "currentColor" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ ...draw, delay: reduced ? 0 : (drawDuration + strikeDelay) / 1000 }}
            />
          )}
        </span>
      )}
    </span>
  );
}
