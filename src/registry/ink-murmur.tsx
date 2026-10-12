"use client";
// A breathing mono status line that settles into a timed summary, with an expandable list of steps.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

const EMPTY_STEPS: string[] = [];

interface InkMurmurProps {
  label?: string;
  /** Shown once settled; defaults to "Done in {time}". */
  doneLabel?: string;
  /** Replaces the label text: receives elapsed seconds and whether work is ongoing. */
  renderLabel?: (elapsed: number, working: boolean) => ReactNode;
  glyph?: "dot" | "ring" | "none";
  steps?: string[];
  collapsible?: boolean;
  collapseOnSettle?: boolean;
  color?: string;
  glyphColor?: string;
  fontSize?: number;
  /** Seconds per breath of the glyph. */
  breathPeriod?: number;
  /** How far the glyph fades on each breath (0–1). */
  breathDepth?: number;
  shimmer?: boolean;
  shimmerDuration?: number;
  settleDuration?: number;
  settleBlur?: number;
  working?: boolean;
  /** Seconds after which it settles on its own; 0 waits for `working` to turn false. */
  settleAfter?: number;
  /** Controlled elapsed seconds. */
  elapsed?: number;
  showTimer?: boolean;
  onSettle?: (elapsed: number) => void;
  style?: CSSProperties;
  className?: string;
}

export function InkMurmur({
  label = "Composing…",
  doneLabel = "",
  renderLabel,
  glyph = "dot",
  steps = EMPTY_STEPS,
  collapsible = true,
  collapseOnSettle = true,
  color = "currentColor",
  glyphColor = "",
  fontSize = 13,
  breathPeriod = 1.6,
  breathDepth = 0.45,
  shimmer = true,
  shimmerDuration = 1.8,
  settleDuration = 350,
  settleBlur = 2,
  working = true,
  settleAfter = 0,
  elapsed,
  showTimer = true,
  onSettle,
  style,
  className,
}: InkMurmurProps) {
  const reduce = useReducedMotion();
  const [clock, setClock] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const started = useRef(0);
  const seconds = elapsed ?? clock;
  const busy = working && !(settleAfter > 0 && seconds >= settleAfter);

  useEffect(() => {
    if (!busy || elapsed !== undefined) return;
    if (!started.current) started.current = performance.now();
    const id = setInterval(() => setClock((performance.now() - started.current) / 1000), 100);
    return () => clearInterval(id);
  }, [busy, elapsed]);

  const settledOnce = useRef(false);
  useEffect(() => {
    if (busy || settledOnce.current) return;
    settledOnce.current = true;
    if (collapseOnSettle) setExpanded(false);
    onSettle?.(seconds);
  }, [busy, collapseOnSettle, onSettle, seconds]);

  const time = `${seconds.toFixed(1)}s`;
  const text = renderLabel
    ? renderLabel(seconds, busy)
    : busy
      ? label
      : doneLabel || `Done in ${time}`;
  const ink = glyphColor || color;
  const sweep = busy && shimmer && !reduce;
  const shift = useMotionValue(100);
  const maskPosition = useMotionTemplate`${shift}% 0%`;
  useEffect(() => {
    if (!sweep) return;
    const run = animate(shift, [100, 0], {
      duration: shimmerDuration,
      repeat: Infinity,
      ease: "linear",
    });
    return () => run.stop();
  }, [sweep, shimmerDuration, shift]);
  const canToggle = collapsible && steps.length > 0;

  return (
    <div
      className={cn("inline-flex flex-col font-mono uppercase tracking-[0.16em]", className)}
      style={{ color: color === "currentColor" ? undefined : color, fontSize, ...style }}
    >
      <button
        type="button"
        disabled={!canToggle}
        aria-expanded={canToggle ? expanded : undefined}
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-2.5 text-left uppercase outline-none focus-visible:underline disabled:cursor-default"
        style={{ fontSize: "1em" }}
      >
        {glyph !== "none" && (
          <motion.span
            aria-hidden
            className={cn(
              "inline-block h-[0.5em] w-[0.5em] rounded-full",
              glyph === "ring" && "border",
            )}
            style={glyph === "ring" ? { borderColor: ink } : { background: ink }}
            animate={
              busy && !reduce
                ? { opacity: [1, 1 - breathDepth, 1], scale: [1, 1 - breathDepth / 3, 1] }
                : { opacity: 1, scale: 1 }
            }
            transition={
              busy && !reduce
                ? { duration: breathPeriod, repeat: Infinity, ease: "easeInOut" }
                : undefined
            }
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={busy ? "busy" : "done"}
            initial={{ opacity: 0, filter: `blur(${settleBlur}px)` }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: `blur(${settleBlur}px)` }}
            transition={{ duration: reduce ? 0 : settleDuration / 1000 }}
          >
            {sweep ? (
              <motion.span
                // A soft dip in opacity travels across the words.
                style={{
                  maskImage: "linear-gradient(90deg, black 35%, rgba(0,0,0,0.3) 50%, black 65%)",
                  maskSize: "250% 100%",
                  maskPosition,
                }}
              >
                {text}
              </motion.span>
            ) : (
              text
            )}
          </motion.span>
        </AnimatePresence>
        {showTimer && busy && <span className="tabular-nums opacity-60">{time}</span>}
        {canToggle && (
          <motion.span aria-hidden className="opacity-60" animate={{ rotate: expanded ? 0 : 180 }}>
            ˄
          </motion.span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {canToggle && expanded && (
          <motion.ol
            className="overflow-hidden pl-[1.1em] text-[0.8em]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : settleDuration / 1000 }}
          >
            {steps.map((step, i) => {
              const current = busy && i === steps.length - 1;
              return (
                <li key={step} className={cn("mt-1 flex gap-2", !current && "opacity-50")}>
                  <span aria-hidden>{current ? "›" : "✓"}</span>
                  {step}
                </li>
              );
            })}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}
