"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
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
      initial={{ backgroundPosition: "200% center" }}
      animate={{ backgroundPosition: "-50% center" }}
      transition={{
        repeat: Infinity,
        duration: speed,
        ease: "linear",
      }}
      {...props}
    >
      {text}
    </motion.span>
  );
}
