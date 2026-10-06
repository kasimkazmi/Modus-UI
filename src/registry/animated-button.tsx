"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface AnimatedButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedButton({ children, className }: AnimatedButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      className={cn("rounded-lg bg-blue-500 px-4 py-2 text-white", className)}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}
