"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";

interface BorderBeamProps {
  /** The duration of the full perimeter rotation in seconds. */
  duration?: number;
  /** Thickness of the beam in pixels. */
  borderWidth?: number;
  /** Width of the beam gradient in pixels. */
  size?: number;
  /** CSS color values for the beam gradient. */
  colorFrom?: string;
  colorTo?: string;
  /** Optional delay before starting the animation. */
  delay?: number;
  className?: string;
}

export function BorderBeam({
  duration = 8,
  borderWidth = 1.5,
  size = 200,
  colorFrom = "hsl(var(--primary))",
  colorTo = "transparent",
  delay = 0,
  className,
}: BorderBeamProps) {
  // Null during SSR, so the tree must not branch on it: only the animation does.
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        className,
      )}
    >
      <div
        className="absolute inset-0 rounded-[inherit] border"
        style={{
          borderWidth,
          borderColor: "transparent",
          maskImage: `linear-gradient(to right, transparent, black ${size}px, black)`,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />

      {/* We use a large rotating rect that's masked out by the parent div to trace the edge. */}
      <motion.div
        className="absolute -left-1/2 -top-1/2 aspect-square h-[200%] w-[200%]"
        style={{
          background: `conic-gradient(from 90deg at 50% 50%, ${colorTo} 0%, ${colorFrom} 50%, ${colorTo} 100%)`,
        }}
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration,
          ease: "linear",
          delay,
        }}
      />
      {/* Cut out the inside */}
      <div
        className="absolute m-px rounded-[inherit] bg-background"
        style={{ inset: borderWidth }}
      />
    </div>
  );
}
