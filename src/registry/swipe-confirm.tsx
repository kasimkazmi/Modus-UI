"use client";
// Drag-to-confirm track; a promise from onConfirm drives pending, signed and failed states.

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type Phase = "idle" | "pending" | "done" | "error";

interface SwipeConfirmProps {
  label?: string;
  doneLabel?: string;
  errorLabel?: string;
  onConfirm?: () => unknown;
  onDone?: () => void;
  onError?: (error: unknown) => void;
  trackColor?: string;
  handleColor?: string;
  successColor?: string;
  dangerColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  /** Spring speed of the handle returning, 0–100. */
  speed?: number;
  returnBounce?: number;
  /** How far the handle dips in scale when it lands at the end. */
  landingDip?: number;
  holdMs?: number;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const PAD = 4;

export function SwipeConfirm({
  label = "Slide to sign",
  doneLabel = "Signed",
  errorLabel = "Could not sign",
  onConfirm,
  onDone,
  onError,
  trackColor = "hsl(var(--muted))",
  handleColor = "hsl(var(--primary))",
  successColor = "hsl(var(--accent-foreground))",
  dangerColor = "hsl(var(--destructive))",
  width = 280,
  height = 56,
  radius = 10,
  speed = 50,
  returnBounce = 0.38,
  landingDip = 0.026,
  holdMs = 1500,
  disabled = false,
  icon,
  className,
}: SwipeConfirmProps) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const knob = height - PAD * 2;
  const travel = width - knob - PAD * 2;
  const x = useMotionValue(0);
  const labelOpacity = useTransform(x, [0, travel * 0.6], [1, 0]);
  const scale = useMotionValue(1);
  const back = reduced
    ? { duration: 0 }
    : { type: "spring" as const, visualDuration: 0.9 - speed * 0.007, bounce: returnBounce };

  useEffect(() => {
    if (phase !== "done" && phase !== "error") return;
    const t = setTimeout(() => {
      setPhase("idle");
      animate(x, 0, back);
    }, holdMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, holdMs]);

  const confirm = async () => {
    animate(x, travel, reduced ? { duration: 0 } : { duration: 0.15 });
    if (!reduced) animate(scale, [1, 1 - landingDip * 4, 1], { duration: 0.3 });
    setPhase("pending");
    try {
      await onConfirm?.();
      setPhase("done");
      onDone?.();
    } catch (error) {
      setPhase("error");
      onError?.(error);
    }
  };

  const locked = disabled || phase !== "idle";
  const tone = phase === "done" ? successColor : phase === "error" ? dangerColor : handleColor;
  const text = phase === "done" ? doneLabel : phase === "error" ? errorLabel : label;

  return (
    <div
      className={cn(
        "relative select-none border border-[hsl(var(--border))] font-mono text-xs uppercase tracking-[0.16em]",
        disabled && "opacity-50",
        className,
      )}
      style={{ width, height, borderRadius: radius, background: trackColor }}
    >
      <motion.span
        aria-live="polite"
        className="absolute inset-0 flex items-center justify-center text-[hsl(var(--muted-foreground))]"
        style={{
          opacity: phase === "idle" ? labelOpacity : 1,
          paddingLeft: knob,
          color: phase === "idle" ? undefined : tone,
        }}
      >
        {phase === "pending" ? "…" : text}
      </motion.span>
      <motion.button
        type="button"
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={phase === "idle" ? 0 : 100}
        disabled={locked}
        drag={locked ? false : "x"}
        dragConstraints={{ left: 0, right: travel }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={() => (x.get() > travel * 0.9 ? confirm() : animate(x, 0, back))}
        onKeyDown={(e) => (e.key === "Enter" || e.key === "ArrowRight") && !locked && confirm()}
        className="absolute flex cursor-grab items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] active:cursor-grabbing disabled:cursor-default"
        style={{
          left: PAD,
          top: PAD,
          width: knob,
          height: knob,
          x,
          scale,
          borderRadius: Math.max(0, radius - PAD),
          background: tone,
          color: "hsl(var(--primary-foreground))",
          touchAction: "none",
        }}
      >
        {phase === "pending" ? (
          <motion.span
            className="block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
            animate={reduced ? {} : { rotate: 360 }}
            transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
          />
        ) : (
          (icon ?? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {phase === "done" ? (
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              ) : phase === "error" ? (
                <path d="M7 7l10 10M17 7L7 17" />
              ) : (
                <path d="M5 12h14M13 6l6 6-6 6" />
              )}
            </svg>
          ))
        )}
      </motion.button>
    </div>
  );
}
