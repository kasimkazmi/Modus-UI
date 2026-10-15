"use client";
// Moves a corner-bracket focus frame between words, blurring the rest.
import { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
}

const CORNERS = [
  "left-0 top-0 border-l-[3px] border-t-[3px]",
  "right-0 top-0 border-r-[3px] border-t-[3px]",
  "bottom-0 left-0 border-b-[3px] border-l-[3px]",
  "bottom-0 right-0 border-b-[3px] border-r-[3px]",
];

export function TrueFocus({
  sentence = "True Focus",
  separator = " ",
  manualMode = false,
  blurAmount = 5,
  borderColor = "hsl(var(--primary))",
  glowColor = "hsl(var(--primary) / 0.6)",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  className,
}: TrueFocusProps) {
  const reduce = useReducedMotion();
  const frameId = useId();
  const words = sentence.split(separator);
  const [focus, setFocus] = useState(0);
  const duration = reduce ? 0 : animationDuration;

  useEffect(() => {
    if (manualMode) return;
    const id = setInterval(
      () => setFocus((f) => (f + 1) % words.length),
      (animationDuration + pauseBetweenAnimations) * 1000,
    );
    return () => clearInterval(id);
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  return (
    <p
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-5xl font-bold text-[hsl(var(--foreground))]",
        className,
      )}
      aria-label={sentence}
    >
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden
          className="relative px-2 py-1"
          onMouseEnter={manualMode ? () => setFocus(i) : undefined}
        >
          <motion.span
            className="block"
            animate={{ filter: `blur(${i === focus ? 0 : blurAmount}px)` }}
            transition={{ duration }}
          >
            {word}
          </motion.span>
          {i === focus && (
            <motion.span
              layoutId={frameId}
              transition={{ duration, ease: "easeInOut" }}
              className="pointer-events-none absolute -inset-1"
            >
              {CORNERS.map((pos) => (
                <span
                  key={pos}
                  className={cn("absolute h-4 w-4 rounded-[3px]", pos)}
                  style={{ borderColor, filter: `drop-shadow(0 0 4px ${glowColor})` }}
                />
              ))}
            </motion.span>
          )}
        </span>
      ))}
    </p>
  );
}
