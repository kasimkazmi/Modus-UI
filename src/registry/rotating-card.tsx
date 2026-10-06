"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface RotatingCardProps {
  children: React.ReactNode;
  className?: string;
}

export function RotatingCard({ children, className }: RotatingCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800", className)}
      whileHover={prefersReducedMotion ? undefined : { rotateY: 10 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {children}
    </motion.div>
  );
}
