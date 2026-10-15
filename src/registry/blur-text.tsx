"use client";
// Words or letters sharpen out of a blur as the text scrolls into view.
import { useRef } from "react";
import { motion, useInView, useReducedMotion, type Easing } from "framer-motion";
import { cn } from "@/lib/utils";

interface BlurTextProps {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Record<string, any>;
  animationTo?: Record<string, any>[];
  easing?: string | number[] | ((t: number) => number);
  onAnimationComplete?: () => void;
  stepDuration?: number;
}

export function BlurText({
  text = "",
  delay = 200,
  className,
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  easing = "easeOut",
  onAnimationComplete,
  stepDuration = 0.35,
}: BlurTextProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: threshold,
    margin: rootMargin as NonNullable<Parameters<typeof useInView>[1]>["margin"],
  });

  const offset = direction === "top" ? -1 : 1;
  const from = animationFrom ?? { filter: "blur(10px)", opacity: 0, y: 40 * offset };
  const steps = animationTo ?? [
    { filter: "blur(4px)", opacity: 0.5, y: 6 * offset },
    { filter: "blur(0px)", opacity: 1, y: 0 },
  ];
  // Merge the start state and each step into per-property keyframe arrays.
  const keyframes = Object.fromEntries(
    Object.keys(from).map((key) => [key, [from[key], ...steps.map((s) => s[key] ?? from[key])]]),
  );
  const times = keyframes[Object.keys(from)[0]]?.map((_: unknown, i: number) => i / steps.length);

  const parts = animateBy === "words" ? text.split(" ") : [...text];
  // Reduced motion jumps straight to the final state; the start state stays the same so the
  // first render matches the server's.
  const settled = steps[steps.length - 1];

  return (
    <p ref={ref} className={cn("flex flex-wrap", className)} aria-label={text}>
      {parts.map((part, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block whitespace-pre will-change-[transform,filter,opacity]"
          initial={from}
          animate={reduce ? settled : inView ? keyframes : undefined}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  duration: stepDuration * steps.length,
                  times,
                  delay: (i * delay) / 1000,
                  ease: easing as Easing,
                }
          }
          onAnimationComplete={i === parts.length - 1 ? onAnimationComplete : undefined}
        >
          {part}
          {animateBy === "words" && i < parts.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </p>
  );
}
