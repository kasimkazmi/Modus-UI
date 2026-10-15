"use client";
// Press-and-hold confirm button: a tint rises (with a wavy crest) while held, and drains if released early.

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionTemplate,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface SteadyPressProps {
  children?: string;
  doneLabel?: string;
  icon?: React.ReactNode;
  doneIcon?: React.ReactNode;
  backgroundColor?: string;
  fillColor?: string;
  textColor?: string;
  fillTextColor?: string;
  size?: "sm" | "md" | "lg";
  radius?: number;
  fillDirection?: "up" | "right";
  holdTime?: number;
  releaseTime?: number;
  pressScale?: number;
  wave?: boolean;
  waveAmplitude?: number;
  glow?: boolean;
  resetAfter?: number;
  disabled?: boolean;
  onHold?: () => void;
  onTap?: () => void;
  className?: string;
}

const SIZES = { sm: "h-9 px-4 text-[10px]", md: "h-11 px-6 text-xs", lg: "h-14 px-8 text-sm" };
const TAP_MS = 250;

export function SteadyPress({
  children = "Hold to publish",
  doneLabel = "Published",
  icon = null,
  doneIcon = null,
  backgroundColor = "hsl(var(--secondary))",
  fillColor = "hsl(var(--primary))",
  textColor = "hsl(var(--secondary-foreground))",
  fillTextColor = "hsl(var(--primary-foreground))",
  size = "md",
  radius = 14,
  fillDirection = "up",
  holdTime = 2000,
  releaseTime = 200,
  pressScale = 0.97,
  wave = true,
  waveAmplitude = 6,
  glow = true,
  resetAfter = 1200,
  disabled = false,
  onHold,
  onTap,
  className,
}: SteadyPressProps) {
  const prefersReduced = useReducedMotion();
  // Follow the setting only after hydration, so the first render matches the server's.
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(Boolean(prefersReduced)), [prefersReduced]);
  const level = useMotionValue(0); // 0–100
  const run = useRef<AnimationPlaybackControls | null>(null);
  const pressedAt = useRef(0);
  const [pressed, setPressed] = useState(false);
  const [done, setDone] = useState(false);
  const up = fillDirection === "up";
  const hidden = useTransform(level, (v) => 100 - v);
  const clip = useMotionTemplate`inset(${up ? hidden : 0}% ${up ? 0 : hidden}% 0% 0%)`;
  const crest = useTransform(level, (v) => `${v}%`);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      setDone(false);
      run.current = animate(level, 0, { duration: reduced ? 0 : 0.4 });
    }, resetAfter);
    return () => clearTimeout(t);
  }, [done, resetAfter, level, reduced]);

  const press = () => {
    if (disabled || done) return;
    pressedAt.current = Date.now();
    setPressed(true);
    run.current?.stop();
    run.current = animate(level, 100, {
      duration: (holdTime / 1000) * (1 - level.get() / 100),
      ease: "linear",
      onComplete: () => {
        setPressed(false);
        setDone(true);
        onHold?.();
      },
    });
  };
  const release = () => {
    if (!pressed) return;
    setPressed(false);
    if (Date.now() - pressedAt.current < TAP_MS) onTap?.();
    run.current?.stop();
    run.current = animate(level, 0, { duration: releaseTime / 1000, ease: "easeOut" });
  };

  const label = (
    <span className="inline-flex items-center gap-2">
      {done ? doneIcon : icon}
      {done ? doneLabel : children}
    </span>
  );
  const amp = wave && !reduced ? waveAmplitude : 0;

  return (
    <motion.button
      type="button"
      disabled={disabled}
      aria-label={done ? doneLabel : children}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onKeyDown={(e) =>
        (e.key === " " || e.key === "Enter") && !e.repeat && (e.preventDefault(), press())
      }
      onKeyUp={(e) => (e.key === " " || e.key === "Enter") && release()}
      animate={{
        scale: pressed && !reduced ? pressScale : 1,
        boxShadow: done && glow ? `0 0 24px -4px ${fillColor}` : "0 0 0 0 transparent",
      }}
      className={cn(
        "relative select-none overflow-hidden font-mono uppercase tracking-[0.16em] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50",
        SIZES[size],
        className,
      )}
      style={{
        background: backgroundColor,
        color: textColor,
        borderRadius: radius,
        touchAction: "none",
      }}
    >
      <motion.span
        aria-hidden
        className="absolute"
        style={
          up
            ? { left: 0, right: 0, bottom: 0, height: crest, background: fillColor }
            : { top: 0, bottom: 0, left: 0, width: crest, background: fillColor }
        }
      >
        {amp > 0 && (
          <motion.svg
            className="absolute"
            viewBox={up ? "0 0 40 10" : "0 0 10 40"}
            preserveAspectRatio="none"
            style={
              up
                ? { bottom: "100%", left: 0, width: "200%", height: amp }
                : { left: "100%", top: 0, height: "200%", width: amp }
            }
            animate={up ? { x: ["0%", "-50%"] } : { y: ["0%", "-50%"] }}
            transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
          >
            <path
              d={up ? "M0 10V5Q5 0 10 5T20 5T30 5T40 5V10Z" : "M0 0H5Q10 5 5 10T5 20T5 30T5 40H0Z"}
              fill={fillColor}
            />
          </motion.svg>
        )}
      </motion.span>
      <span className="relative">{label}</span>
      <motion.span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: fillTextColor, clipPath: clip }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
