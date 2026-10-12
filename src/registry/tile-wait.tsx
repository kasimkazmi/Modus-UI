"use client";
// A small tile grid that pulses while work runs, then settles into a check or cross.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Status = "working" | "done" | "error";
type Pattern = "ripple" | "sweep" | "scatter";

interface TileWaitProps {
  label?: string;
  doneLabel?: string;
  errorLabel?: string;
  status?: Status;
  pattern?: Pattern;
  grid?: number;
  shape?: "square" | "circle";
  color?: string;
  doneColor?: string;
  errorColor?: string;
  cellSize?: number;
  gap?: number;
  fontSize?: number;
  step?: number;
  idleOpacity?: number;
  glow?: boolean;
  glowColor?: string;
  showTimer?: boolean;
  /** Elapsed seconds; when set it replaces the internal timer. */
  elapsed?: number;
  style?: CSSProperties;
  className?: string;
}

/** Which "phase" each tile belongs to; the lit phase advances every tick. */
function phaseOf(pattern: Pattern, row: number, col: number, grid: number) {
  const mid = (grid - 1) / 2;
  if (pattern === "sweep") return row + col;
  if (pattern === "scatter") return (row * 7 + col * 13) % (grid + 1);
  return Math.round(Math.max(Math.abs(row - mid), Math.abs(col - mid)));
}

export function TileWait({
  label = "Composing",
  doneLabel = "Done in",
  errorLabel = "Failed after",
  status = "working",
  pattern = "ripple",
  grid = 3,
  shape = "square",
  color = "currentColor",
  doneColor = "hsl(var(--primary))",
  errorColor = "hsl(var(--destructive))",
  cellSize = 5,
  gap = 3,
  fontSize = 12,
  step = 90,
  idleOpacity = 0.15,
  glow = false,
  glowColor = "",
  showTimer = true,
  elapsed,
  style,
  className,
}: TileWaitProps) {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef(0);
  const working = status === "working";

  useEffect(() => {
    if (!working || reduce) return;
    const id = setInterval(() => setTick((t) => t + 1), step);
    return () => clearInterval(id);
  }, [working, reduce, step]);

  useEffect(() => {
    if (!working) return;
    startedAt.current = performance.now();
    setSeconds(0);
    const id = setInterval(() => setSeconds((performance.now() - startedAt.current) / 1000), 100);
    return () => clearInterval(id);
  }, [working]);

  const phases =
    pattern === "sweep" ? grid * 2 - 1 : pattern === "scatter" ? grid + 1 : Math.ceil(grid / 2);
  const lit = tick % phases;
  const tone = status === "done" ? doneColor : status === "error" ? errorColor : color;
  const box = grid * cellSize + (grid - 1) * gap;
  const time = `${(elapsed ?? seconds).toFixed(1)}s`;
  const caption = working ? label : status === "done" ? doneLabel : errorLabel;
  const shadow = glow ? `drop-shadow(0 0 ${cellSize}px ${glowColor || tone})` : undefined;

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2.5 font-mono uppercase tracking-[0.18em]",
        className,
      )}
      style={{ fontSize, ...style }}
    >
      <span
        className="relative inline-block shrink-0"
        style={{ width: box, height: box, filter: shadow }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {working ? (
            <motion.span
              key="grid"
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: `repeat(${grid}, ${cellSize}px)`, gap }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: reduce ? 0 : 0.18 }}
            >
              {Array.from({ length: grid * grid }, (_, i) => {
                const on =
                  !reduce && phaseOf(pattern, Math.floor(i / grid), i % grid, grid) === lit;
                return (
                  <motion.span
                    key={i}
                    animate={{ opacity: reduce ? 0.6 : on ? 1 : idleOpacity }}
                    transition={{ duration: (step / 1000) * 1.5 }}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: tone,
                      borderRadius: shape === "circle" ? "50%" : 1,
                    }}
                  />
                );
              })}
            </motion.span>
          ) : (
            <motion.svg
              key={status}
              viewBox="0 0 16 16"
              className="absolute inset-0 h-full w-full"
              fill="none"
              stroke={tone}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0, scale: reduce ? 1 : 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
            >
              <motion.path
                d={status === "done" ? "M3 8.5 6.5 12 13 4.5" : "M4 4l8 8M12 4l-8 8"}
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduce ? 0 : 0.3 }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </span>
      <span>{caption}</span>
      {showTimer && (
        <span
          className="tabular-nums tracking-normal opacity-60"
          style={{ fontSize: fontSize * 0.85 }}
        >
          {time}
        </span>
      )}
    </span>
  );
}
