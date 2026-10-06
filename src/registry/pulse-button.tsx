"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface PulseButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function PulseButton({ children, className }: PulseButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      className={cn("rounded-lg bg-green-500 px-4 py-2 text-white", className)}
      // Reduced motion: no pulse; the button rests at its natural scale.
      animate={prefersReducedMotion ? undefined : { scale: [1, 1.1, 1] }}
      transition={prefersReducedMotion ? undefined : { duration: 1, repeat: Infinity }}
    >
      {children}
    </motion.button>
  );
}
