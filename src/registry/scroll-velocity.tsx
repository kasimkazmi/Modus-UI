"use client";
// Marquee rows that drift on their own and speed up with the scroll velocity.

import * as React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface ScrollVelocityProps extends React.HTMLAttributes<HTMLDivElement> {
  scrollContainerRef?: React.RefObject<HTMLElement>;
  texts?: string[];
  velocity?: number;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
  velocityMapping?: { input: number[]; output: number[] };
  parallaxClassName?: string;
  scrollerClassName?: string;
  parallaxStyle?: React.CSSProperties;
  scrollerStyle?: React.CSSProperties;
}

interface RowProps {
  text: string;
  speed: number;
  boost: MotionValue<number>;
  numCopies: number;
  still: boolean;
  parallaxClassName?: string;
  scrollerClassName?: string;
  parallaxStyle?: React.CSSProperties;
  scrollerStyle?: React.CSSProperties;
}

function Row({ text, speed, boost, numCopies, still, ...styling }: RowProps) {
  const copyRef = React.useRef<HTMLSpanElement>(null);
  const offset = useMotionValue(0);
  const heading = React.useRef(1);

  useAnimationFrame((_, delta) => {
    const copy = copyRef.current?.offsetWidth;
    if (still || !copy) return;
    const b = boost.get();
    if (b !== 0) heading.current = Math.sign(b);
    const step = speed * heading.current * (1 + Math.abs(b)) * (delta / 1000);
    // Keep the offset within one copy's width so the loop is seamless.
    offset.set((((offset.get() - step) % copy) - copy) % copy);
  });

  return (
    <div
      className={cn("w-full overflow-hidden whitespace-nowrap", styling.parallaxClassName)}
      style={styling.parallaxStyle}
    >
      <motion.div
        className={cn(
          "flex w-max font-serif text-4xl font-bold tracking-tight md:text-7xl",
          styling.scrollerClassName,
        )}
        style={{ x: offset, ...styling.scrollerStyle }}
      >
        {Array.from({ length: numCopies }, (_, i) => (
          <span
            key={i}
            ref={i === 0 ? copyRef : undefined}
            aria-hidden={i > 0}
            className="pr-[0.5em]"
          >
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function ScrollVelocity({
  scrollContainerRef,
  texts = [],
  velocity = 100,
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = { input: [0, 1000], output: [0, 5] },
  parallaxClassName,
  scrollerClassName,
  parallaxStyle,
  scrollerStyle,
  className,
  ...props
}: ScrollVelocityProps) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll(scrollContainerRef ? { container: scrollContainerRef } : undefined);
  const smoothVelocity = useSpring(useVelocity(scrollY), { damping, stiffness });
  // Map the magnitude, then restore the sign so scrolling up reverses the rows.
  const boost = useTransform(smoothVelocity, (v) => {
    const { input, output } = velocityMapping;
    const t = Math.min(1, Math.max(0, (Math.abs(v) - input[0]) / (input[1] - input[0] || 1)));
    return Math.sign(v) * (output[0] + t * (output[1] - output[0]));
  });

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      {texts.map((text, i) => (
        <Row
          key={i}
          text={text}
          speed={i % 2 === 0 ? velocity : -velocity}
          boost={boost}
          numCopies={numCopies}
          still={!!reduceMotion}
          parallaxClassName={parallaxClassName}
          scrollerClassName={scrollerClassName}
          parallaxStyle={parallaxStyle}
          scrollerStyle={scrollerStyle}
        />
      ))}
    </div>
  );
}
