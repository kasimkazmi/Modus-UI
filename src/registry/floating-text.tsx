"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface FloatingTextProps {
  children: React.ReactNode;
  className?: string;
}

export function FloatingText({ children, className }: FloatingTextProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("inline-block", className)}
      animate={prefersReducedMotion ? { y: 0 } : { y: [0, -10, 0] }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }
    >
      {children}
    </motion.div>
  );
}
