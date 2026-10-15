"use client";
// A pill whose border carries two light beams that circle the perimeter.

import type React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type StarBorderProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  color?: string;
  speed?: number;
  thickness?: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
};

export function StarBorder({
  as: Tag = "button",
  color = "rgba(255, 255, 255, 0.8)",
  speed = 6,
  thickness = 1,
  backgroundColor = "hsl(var(--background))",
  textColor = "hsl(var(--foreground))",
  borderColor = "hsl(var(--border))",
  className,
  children,
  ...props
}: StarBorderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Tag
      className={cn(
        "relative isolate inline-flex overflow-hidden rounded-full font-sans text-sm font-medium",
        className,
      )}
      style={{ padding: thickness, background: borderColor }}
      {...props}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[max(300%,300px)]"
        style={{
          x: "-50%",
          y: "-50%",
          background: `conic-gradient(from 0deg, transparent 0deg, ${color} 30deg, transparent 60deg, transparent 180deg, ${color} 210deg, transparent 240deg)`,
        }}
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      />
      <span
        className="relative rounded-full px-6 py-3"
        style={{ background: backgroundColor, color: textColor }}
      >
        {children}
      </span>
    </Tag>
  );
}
