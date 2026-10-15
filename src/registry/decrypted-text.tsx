"use client";
// Scrambles text with random glyphs, then resolves it on hover or when in view.
import { useEffect, useMemo, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: "view" | "hover";
  delay?: number;
}

export function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className,
  parentClassName,
  encryptedClassName,
  animateOn = "hover",
  delay = 0,
}: DecryptedTextProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [active, setActive] = useState(false);
  // Frames elapsed since the run started; -1 means idle (plain text shown).
  const [frame, setFrame] = useState(-1);

  const pool = useMemo(
    () => (useOriginalCharsOnly ? [...new Set(text.replace(/\s/g, ""))].join("") : characters),
    [useOriginalCharsOnly, text, characters],
  );

  // Indices in the order they resolve during a sequential reveal.
  const order = useMemo(() => {
    const idx = [...text].map((_, i) => i);
    if (revealDirection === "end") return idx.reverse();
    if (revealDirection === "center") {
      const mid = (text.length - 1) / 2;
      return idx.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
    }
    return idx;
  }, [text, revealDirection]);

  const totalFrames = sequential ? text.length : maxIterations;

  useEffect(() => {
    if (animateOn === "view" && inView) setActive(true);
  }, [animateOn, inView]);

  useEffect(() => {
    if (!active || reduce) return setFrame(-1);
    let tick: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      setFrame(0);
      tick = setInterval(() => {
        setFrame((f) => {
          if (f + 1 < totalFrames) return f + 1;
          clearInterval(tick);
          return -1;
        });
      }, speed);
    }, delay);
    return () => {
      clearTimeout(start);
      clearInterval(tick);
    };
  }, [active, reduce, speed, delay, totalFrames]);

  const resolved = useMemo(
    () => new Set(sequential && frame >= 0 ? order.slice(0, frame) : []),
    [sequential, frame, order],
  );

  return (
    <span
      ref={ref}
      className={cn("inline-block whitespace-pre-wrap", parentClassName)}
      onMouseEnter={animateOn === "hover" ? () => setActive(true) : undefined}
      onMouseLeave={animateOn === "hover" ? () => setActive(false) : undefined}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden className={className}>
        {[...text].map((char, i) => {
          const scrambled = frame >= 0 && char.trim() !== "" && !resolved.has(i);
          return (
            <span key={i} className={scrambled ? encryptedClassName : undefined}>
              {scrambled ? pool[Math.floor(Math.random() * pool.length)] : char}
            </span>
          );
        })}
      </span>
    </span>
  );
}
