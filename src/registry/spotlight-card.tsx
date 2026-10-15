"use client";
// Card with a soft radial light that tracks the pointer.

import * as React from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
}

export function SpotlightCard({
  spotlightColor = "hsl(var(--primary) / 0.14)",
  className,
  children,
  ...props
}: SpotlightCardProps) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const [lit, setLit] = React.useState(false);
  const background = useMotionTemplate`radial-gradient(circle at ${x}px ${y}px, ${spotlightColor}, transparent 70%)`;

  return (
    <div
      {...props}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-card-foreground",
        className,
      )}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left);
        y.set(event.clientY - rect.top);
      }}
      onPointerEnter={() => setLit(true)}
      onPointerLeave={() => setLit(false)}
      onFocus={() => setLit(true)}
      onBlur={() => setLit(false)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background }}
        initial={false}
        animate={{ opacity: lit ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
      />
      {children}
    </div>
  );
}
