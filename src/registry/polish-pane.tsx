"use client";
// An image frame that sharpens from a coarse mosaic as a generation advances.

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type Status = "generating" | "refining" | "done" | "error";

const DEFAULT_LABELS: Record<Status, string> = {
  generating: "Generating",
  refining: "Refining",
  done: "Done",
  error: "Failed",
};

// Mosaic cell sizes in px, coarse to fine. Each status walks its own slice.
const CELLS = [28, 20, 14, 10, 7, 5];
const RANGE: Record<Status, [number, number]> = {
  generating: [0, 2],
  refining: [3, 5],
  done: [6, 6],
  error: [2, 2],
};

export interface PolishPaneProps {
  status?: string;
  children?: ReactNode;
  aspectRatio?: string;
  width?: number;
  radius?: number;
  background?: string;
  color?: string;
  stageDuration?: number;
  sweep?: boolean;
  showStatus?: boolean;
  hideAfter?: number;
  labels?: Partial<Record<Status, string>>;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function PolishPane({
  status = "generating",
  children,
  aspectRatio = "1 / 1",
  width = 320,
  radius = 6,
  background = "hsl(var(--muted))",
  color = "hsl(var(--foreground))",
  stageDuration = 400,
  sweep = true,
  showStatus = true,
  hideAfter = 1200,
  labels = DEFAULT_LABELS,
  retryLabel = "Retry",
  onRetry,
  className,
}: PolishPaneProps) {
  const reduce = useReducedMotion();
  const state = (status in RANGE ? status : "generating") as Status;
  const [from, to] = RANGE[state];
  const [step, setStep] = useState(from);
  const [pillVisible, setPillVisible] = useState(true);

  useEffect(() => {
    setStep(from);
    if (from === to) return;
    const id = setInterval(() => setStep((s) => (s >= to ? from : s + 1)), stageDuration);
    return () => clearInterval(id);
  }, [from, to, stageDuration]);

  useEffect(() => {
    setPillVisible(true);
    if (state !== "done") return;
    const id = setTimeout(() => setPillVisible(false), hideAfter);
    return () => clearTimeout(id);
  }, [state, hideAfter]);

  const cell = CELLS[step];
  const busy = state === "generating" || state === "refining";
  const label = { ...DEFAULT_LABELS, ...labels }[state];

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ width, aspectRatio, borderRadius: radius, background, color }}
      aria-busy={busy}
    >
      <div className="absolute inset-0">{children}</div>

      {/* Mosaic: a blur scaled to the cell size under a matching hairline grid. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{ opacity: cell ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.4 }}
        style={{
          backdropFilter: `blur(${(cell ?? 0) / 2}px)`,
          WebkitBackdropFilter: `blur(${(cell ?? 0) / 2}px)`,
          backgroundImage: `linear-gradient(to right, hsl(var(--background) / 0.18) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--background) / 0.18) 1px, transparent 1px)`,
          backgroundSize: `${cell ?? 1}px ${cell ?? 1}px`,
        }}
      />

      {sweep && busy && !reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1/3"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--background) / 0.35), transparent)",
          }}
          initial={{ left: "-35%" }}
          animate={{ left: "110%" }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <AnimatePresence>
        {showStatus && pillVisible && (
          <motion.div
            key={state}
            initial={{ opacity: 0, y: reduce ? 0 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="absolute left-2 top-2 flex items-center gap-2 rounded-[4px] bg-background/85 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur"
            role="status"
          >
            <span
              className="size-1.5 rounded-full"
              style={{
                background:
                  state === "error"
                    ? "hsl(var(--destructive))"
                    : state === "done"
                      ? "hsl(var(--primary))"
                      : "currentColor",
              }}
            />
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      {state === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="absolute inset-x-0 bottom-3 mx-auto flex w-fit items-center gap-1.5 rounded-[4px] bg-background px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        >
          <HugeiconsIcon icon={RefreshIcon} size={12} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
