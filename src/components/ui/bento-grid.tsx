"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

interface BentoCardProps {
  children: ReactNode;
  colSpan?: number;
  rowSpan?: number;
  className?: string;
}

export function BentoGrid({ children, columns = 3, gap = 16, className = "" }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:[grid-template-columns:repeat(var(--bento-columns),minmax(0,1fr))]",
        className,
      )}
      style={{ "--bento-columns": String(columns), gap } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function BentoCard({ children, colSpan = 1, rowSpan = 1, className = "" }: BentoCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm",
        "sm:[grid-column:span_var(--bento-col-span)] sm:[grid-row:span_var(--bento-row-span)]",
        className,
      )}
      style={
        {
          "--bento-col-span": String(colSpan),
          "--bento-row-span": String(rowSpan),
        } as CSSProperties
      }
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      {children}
    </motion.div>
  );
}
