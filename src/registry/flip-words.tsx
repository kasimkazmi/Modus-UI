"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FlipWordsProps {
  words: string[];
  interval?: number;
  duration?: number;
  className?: string;
}

export function FlipWords({ words, interval = 2, duration = 0.5, className = "" }: FlipWordsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion || words.length < 2) return;

    const id = setInterval(
      () => setIndex((current) => (current + 1) % words.length),
      interval * 1000,
    );
    return () => clearInterval(id);
  }, [interval, prefersReducedMotion, words.length]);

  const word = words[index % Math.max(words.length, 1)] ?? "";

  return (
    <motion.span
      layout={!prefersReducedMotion}
      className={cn("relative inline-flex overflow-visible", className)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={word}
          initial={prefersReducedMotion ? false : { opacity: 0, y: "0.4em", filter: "blur(8px)" }}
          animate={{ opacity: 1, y: "0em", filter: "blur(0px)" }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: "-0.4em", filter: "blur(8px)" }}
          transition={{
            duration: prefersReducedMotion ? 0 : duration,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="whitespace-nowrap"
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
