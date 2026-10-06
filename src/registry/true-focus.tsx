"use client";

import { useEffect, useRef, useState } from "react";
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
  const words = sentence.split(separator);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const prefersReducedMotion = useReducedMotion();
  // Reduced motion: auto mode stops cycling and leaves every word sharp; manual mode moves focus instantly.
  const staticFrame = !!prefersReducedMotion && !manualMode;

  useEffect(() => {
    if (!manualMode && !prefersReducedMotion) {
      const interval = setInterval(
        () => {
          setCurrentIndex((prev) => (prev + 1) % words.length);
        },
        (animationDuration + pauseBetweenAnimations) * 1000,
      );

      return () => clearInterval(interval);
    }
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length, prefersReducedMotion]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
  }, [currentIndex, words.length]);

  const handleMouseEnter = (index: number) => {
    if (manualMode) {
      setLastActiveIndex(index);
      setCurrentIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (manualMode && lastActiveIndex !== null) {
      setCurrentIndex(lastActiveIndex);
    }
  };

  return (
    <div
      className={cn("relative flex flex-wrap items-center justify-center gap-4", className)}
      ref={containerRef}
      style={{ outline: "none", userSelect: "none" }}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className="relative cursor-pointer text-5xl font-black text-foreground md:text-7xl"
            style={{
              filter: isActive || staticFrame ? "blur(0px)" : `blur(${blurAmount}px)`,
              transition: prefersReducedMotion ? "none" : `filter ${animationDuration}s ease`,
              outline: "none",
              userSelect: "none",
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {word}
          </span>
        );
      })}

      <motion.div
        className="pointer-events-none absolute left-0 top-0 box-border border-0"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 ? 1 : 0,
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: animationDuration, ease: "easeInOut" }
        }
        style={
          {
            "--border-color": borderColor,
            "--glow-color": glowColor,
          } as React.CSSProperties
        }
      >
        <span
          className="absolute left-[-12px] top-[-12px] h-5 w-5 rounded-[4px] border-[4px] border-b-0 border-r-0"
          style={{
            borderColor: "var(--border-color)",
            filter: "drop-shadow(0 0 6px var(--border-color))",
          }}
        />
        <span
          className="absolute right-[-12px] top-[-12px] h-5 w-5 rounded-[4px] border-[4px] border-b-0 border-l-0"
          style={{
            borderColor: "var(--border-color)",
            filter: "drop-shadow(0 0 6px var(--border-color))",
          }}
        />
        <span
          className="absolute bottom-[-12px] left-[-12px] h-5 w-5 rounded-[4px] border-[4px] border-r-0 border-t-0"
          style={{
            borderColor: "var(--border-color)",
            filter: "drop-shadow(0 0 6px var(--border-color))",
          }}
        />
        <span
          className="absolute bottom-[-12px] right-[-12px] h-5 w-5 rounded-[4px] border-[4px] border-l-0 border-t-0"
          style={{
            borderColor: "var(--border-color)",
            filter: "drop-shadow(0 0 6px var(--border-color))",
          }}
        />
      </motion.div>
    </div>
  );
}
