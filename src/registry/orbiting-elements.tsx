"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OrbitingElementsProps {
  children: ReactNode;
  radius?: number;
  duration?: number;
  reverse?: boolean;
  showPath?: boolean;
  startAngle?: number;
  className?: string;
}

export function OrbitingElements({
  children,
  radius = 100,
  duration = 20,
  reverse = false,
  showPath = true,
  startAngle = 0,
  className = "",
}: OrbitingElementsProps) {
  const items = Children.toArray(children);
  const prefersReducedMotion = useReducedMotion();
  const spin = reverse ? -360 : 360;

  const transition = {
    duration,
    repeat: Infinity,
    ease: "linear" as const,
  };

  return (
    <div className={cn("relative", className)} style={{ width: radius * 2, height: radius * 2 }}>
      {showPath ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-dashed border-border"
        />
      ) : null}

      {items.map((item, index) => {
        const angle = startAngle + (360 / items.length) * index;

        return (
          <motion.div
            key={index}
            className="absolute left-1/2 top-1/2 size-0"
            initial={{ rotate: angle }}
            animate={prefersReducedMotion ? undefined : { rotate: angle + spin }}
            transition={transition}
          >
            <div className="w-max" style={{ transform: `translateX(${radius}px)` }}>
              <motion.div
                initial={{ rotate: -angle }}
                animate={prefersReducedMotion ? undefined : { rotate: -angle - spin }}
                transition={transition}
                className="flex w-max -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              >
                {item}
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
