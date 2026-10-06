"use client";

import React from "react";
import { motion, HTMLMotionProps, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ShimmerTextProps extends HTMLMotionProps<"span"> {
  text: string;
  className?: string;
  baseColor?: string;
  shimmerColor?: string;
  speed?: number;
  spread?: number;
}

export function ShimmerText({
  text,
  className,
  baseColor = "hsl(var(--muted-foreground))",
  shimmerColor = "hsl(var(--foreground))",
  speed = 3,
  spread = 120,
  ...props
}: ShimmerTextProps) {
  const prefersReducedMotion = useReducedMotion();

  const gradientStyle = {
    backgroundImage: `linear-gradient(${spread}deg, ${baseColor} 0%, ${baseColor} 35%, ${shimmerColor} 50%, ${baseColor} 65%, ${baseColor} 100%)`,
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  return (
    <motion.span
      className={cn("inline-block font-medium", className)}
      style={gradientStyle}
      // Reduced motion: hold a still frame with the highlight centred on the text.
      initial={prefersReducedMotion ? false : { backgroundPosition: "200% center" }}
      animate={
        prefersReducedMotion
          ? { backgroundPosition: "50% center" }
          : { backgroundPosition: "-50% center" }
      }
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { repeat: Infinity, duration: speed, ease: "linear" }
      }
      {...props}
    >
      {text}
    </motion.span>
  );
}
