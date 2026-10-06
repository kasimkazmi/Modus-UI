"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GravityTextSwapProps {
  texts: string[];
  duration?: number;
  pauseDuration?: number;
  className?: string;
}

export function GravityTextSwap({
  texts,
  duration = 0.5,
  pauseDuration = 2,
  className = "",
}: GravityTextSwapProps) {
  const [, setCurrentIndex] = useState(0);
  const [currentText, setCurrentText] = useState(texts[0]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (texts.length <= 1) return;

    const intervalId = setInterval(
      () => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % texts.length;
          setCurrentText(texts[nextIndex] ?? "");
          return nextIndex;
        });
      },
      (duration + pauseDuration) * 1000,
    );

    return () => clearInterval(intervalId);
  }, [texts, duration, pauseDuration]);

  return (
    <div className={cn("inline-block overflow-hidden", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentText}
          className="inline-block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration / 2 }}
        >
          {prefersReducedMotion
            ? currentText
            : (currentText ?? "").split("").map((char, index) => (
                <motion.span
                  key={index}
                  className="inline-block"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    transition: {
                      type: "spring",
                      damping: 12,
                      stiffness: 200,
                      delay: index * 0.03,
                    },
                  }}
                  exit={{
                    y: 20,
                    opacity: 0,
                    transition: {
                      duration: duration / 2,
                      delay: index * 0.02,
                    },
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
