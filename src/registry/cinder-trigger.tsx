"use client";
// Commit button with a recall window drawn as a fuse that burns along its edge.

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "framer-motion";
import { cn } from "@/lib/utils";

export type CinderPhase = "idle" | "armed" | "done";

const SIZES = { sm: "h-8 px-3 text-[11px]", md: "h-10 px-4 text-xs", lg: "h-12 px-6 text-sm" };

export interface CinderTriggerProps {
  label?: string;
  undoLabel?: string;
  doneLabel?: string;
  icon?: ReactNode;
  color?: string;
  background?: string;
  fuseColor?: string;
  size?: keyof typeof SIZES;
  radius?: number;
  undoWindow?: number;
  fuse?: "outline" | "top" | "bottom";
  fuseThickness?: number;
  crossfadeMs?: number;
  commitOn?: "press" | "fuseEnd";
  pauseOnHover?: boolean;
  settle?: "reset" | "stay";
  disabled?: boolean;
  onCommit?: () => void;
  onUndo?: () => void;
  onFuseEnd?: () => void;
  onPhaseChange?: (phase: CinderPhase) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export function CinderTrigger({
  label = "Send proof",
  undoLabel = "Recall",
  doneLabel = "Sent",
  icon,
  color = "hsl(var(--primary-foreground))",
  background = "hsl(var(--primary))",
  fuseColor = "hsl(var(--primary-foreground))",
  size = "md",
  radius = 8,
  undoWindow = 4000,
  fuse = "bottom",
  fuseThickness = 1.5,
  crossfadeMs = 200,
  commitOn = "press",
  pauseOnHover = true,
  settle = "reset",
  disabled = false,
  onCommit,
  onUndo,
  onFuseEnd,
  onPhaseChange,
  type = "button",
  className,
}: CinderTriggerProps) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<CinderPhase>("idle");
  const left = useMotionValue(1);
  const burn = useRef<AnimationPlaybackControls | null>(null);
  const latest = useRef({ onCommit, onFuseEnd, onPhaseChange, commitOn });
  latest.current = { onCommit, onFuseEnd, onPhaseChange, commitOn };

  const go = (next: CinderPhase) => {
    setPhase(next);
    latest.current.onPhaseChange?.(next);
  };

  useEffect(() => {
    if (phase !== "armed") return;
    left.set(1);
    burn.current = animate(left, 0, {
      duration: undoWindow / 1000,
      ease: "linear",
      onComplete: () => {
        const l = latest.current;
        l.onFuseEnd?.();
        if (l.commitOn === "fuseEnd") l.onCommit?.();
        setPhase("done");
        l.onPhaseChange?.("done");
      },
    });
    return () => burn.current?.stop();
  }, [phase, undoWindow, left]);

  useEffect(() => {
    if (phase !== "done" || settle !== "reset") return;
    const t = setTimeout(() => {
      setPhase("idle");
      latest.current.onPhaseChange?.("idle");
    }, 1400);
    return () => clearTimeout(t);
  }, [phase, settle]);

  const undo = () => {
    burn.current?.stop();
    onUndo?.();
    go("idle");
  };

  const press = () => {
    if (phase === "idle") {
      if (commitOn === "press") onCommit?.();
      go("armed");
    } else if (phase === "armed") undo();
  };

  const text = phase === "idle" ? label : phase === "armed" ? undoLabel : doneLabel;
  const fade = reduce ? 0 : crossfadeMs / 2000;

  return (
    <motion.button
      type={type}
      disabled={disabled || (phase === "done" && settle === "stay")}
      onClick={press}
      onKeyDown={(e) => {
        if (e.key === "Escape" && phase === "armed") undo();
      }}
      onHoverStart={() => pauseOnHover && burn.current?.pause()}
      onHoverEnd={() => pauseOnHover && phase === "armed" && burn.current?.play()}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      aria-live="polite"
      className={cn(
        "relative inline-flex select-none items-center justify-center gap-2 overflow-hidden font-mono uppercase tracking-[0.16em] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] disabled:opacity-60",
        SIZES[size],
        className,
      )}
      style={{ borderRadius: radius, background, color }}
    >
      {icon}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={phase}
          initial={{ opacity: 0, y: reduce ? 0 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -4 }}
          transition={{ duration: fade }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
      {phase === "armed" &&
        (fuse === "outline" ? (
          <svg
            className="pointer-events-none absolute overflow-visible"
            style={{
              inset: fuseThickness / 2,
              width: `calc(100% - ${fuseThickness}px)`,
              height: `calc(100% - ${fuseThickness}px)`,
            }}
            aria-hidden
          >
            <motion.rect
              width="100%"
              height="100%"
              rx={Math.max(0, radius - fuseThickness / 2)}
              fill="none"
              stroke={fuseColor}
              strokeWidth={fuseThickness}
              style={{ pathLength: left }}
            />
          </svg>
        ) : (
          <motion.span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 origin-left",
              fuse === "top" ? "top-0" : "bottom-0",
            )}
            style={{ height: fuseThickness, background: fuseColor, scaleX: left }}
          />
        ))}
    </motion.button>
  );
}
