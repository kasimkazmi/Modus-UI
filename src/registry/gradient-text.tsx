"use client";
// Text filled with a gradient that sweeps continuously, with an optional matching border.

import { useRef, useState, type ReactNode } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

type Direction = "horizontal" | "vertical" | "diagonal";

export interface GradientTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
  direction?: Direction;
  pauseOnHover?: boolean;
  yoyo?: boolean;
}

const SWEEP: Record<Direction, { angle: string; size: string; at: (p: number) => string }> = {
  horizontal: { angle: "to right", size: "200% 100%", at: (p) => `${p}% 50%` },
  vertical: { angle: "to bottom", size: "100% 200%", at: (p) => `50% ${p}%` },
  diagonal: { angle: "135deg", size: "200% 200%", at: (p) => `${p}% ${p}%` },
};

export function GradientText({
  children,
  className,
  colors = [
    "hsl(var(--primary))",
    "hsl(var(--primary))",
    "hsl(var(--primary))",
    "hsl(var(--primary))",
    "hsl(var(--primary))",
  ],
  animationSpeed = 8,
  showBorder = false,
  direction = "horizontal",
  pauseOnHover = false,
  yoyo = true,
}: GradientTextProps) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const elapsed = useRef(0);
  const progress = useMotionValue(0);
  const sweep = SWEEP[direction];

  useAnimationFrame((_, delta) => {
    if (reduceMotion || (pauseOnHover && hovered)) return;
    elapsed.current += delta / 1000 / animationSpeed;
    const cycle = elapsed.current % (yoyo ? 2 : 1);
    progress.set(cycle > 1 ? 2 - cycle : cycle);
  });

  const backgroundPosition = useTransform(progress, (p) => sweep.at(p * 100));
  // The palette is laid out twice so the end of a loop lines up with its start.
  const stops = [...colors, ...colors, colors[0]].join(", ");
  const fill = {
    backgroundImage: `linear-gradient(${sweep.angle}, ${stops})`,
    backgroundSize: sweep.size,
    backgroundPosition,
  };

  const text = (
    <motion.span className="bg-clip-text text-transparent" style={fill}>
      {children}
    </motion.span>
  );

  return (
    <motion.span
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={cn("inline-flex max-w-full", showBorder && "rounded-full p-px", className)}
      style={showBorder ? fill : undefined}
    >
      {showBorder ? <span className="rounded-full bg-background px-5 py-2">{text}</span> : text}
    </motion.span>
  );
}
