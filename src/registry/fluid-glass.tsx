"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FluidGlassProps {
  text?: string;
  className?: string;
}

// TODO: Replace this stub with the real component.
export function FluidGlass({ text = "Fluid Glass", className }: FluidGlassProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("font-serif text-4xl text-foreground", className)}
    >
      {text}
    </motion.div>
  );
}
