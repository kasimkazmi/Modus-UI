"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  showRadialGradient?: boolean;
  /** The four blob colours. */
  colors?: [string, string, string, string];
}

export function AuroraBackground({
  children,
  className,
  showRadialGradient = true,
  colors = ["#38bdf8", "#818cf8", "#34d399", "#e879f9"],
  ...props
}: AuroraBackgroundProps) {
  // Reduced motion: the blobs stay at their resting positions as a still gradient.
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "transition-bg relative flex h-[100vh] w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 will-change-transform",
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]`,
          )}
        >
          <div className="absolute inset-0 opacity-50 mix-blend-normal dark:opacity-80 dark:mix-blend-lighten">
            {/* Animated Blob 1 */}
            <motion.div
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      x: ["0%", "20%", "-20%", "0%"],
                      y: ["0%", "-20%", "20%", "0%"],
                      scale: [1, 1.2, 0.8, 1],
                    }
              }
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ backgroundColor: colors[0] }}
              className="absolute -left-[10%] -top-[10%] h-[60%] w-[60%] rounded-full opacity-70 mix-blend-multiply blur-[80px] dark:mix-blend-screen md:blur-[120px]"
            />

            {/* Animated Blob 2 */}
            <motion.div
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      x: ["0%", "-20%", "20%", "0%"],
                      y: ["0%", "20%", "-20%", "0%"],
                      scale: [1, 0.8, 1.2, 1],
                    }
              }
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ backgroundColor: colors[1] }}
              className="absolute -right-[10%] top-[10%] h-[50%] w-[50%] rounded-full opacity-70 mix-blend-multiply blur-[80px] dark:mix-blend-screen md:blur-[120px]"
            />

            {/* Animated Blob 3 */}
            <motion.div
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      x: ["0%", "30%", "-30%", "0%"],
                      y: ["0%", "30%", "-30%", "0%"],
                      scale: [1, 1.3, 0.7, 1],
                    }
              }
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ backgroundColor: colors[2] }}
              className="absolute -bottom-[20%] left-[20%] h-[70%] w-[70%] rounded-full opacity-70 mix-blend-multiply blur-[80px] dark:mix-blend-screen md:blur-[120px]"
            />

            {/* Animated Blob 4 (Extra for richness) */}
            <motion.div
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      x: ["0%", "-30%", "30%", "0%"],
                      y: ["0%", "-30%", "30%", "0%"],
                      scale: [1, 0.9, 1.1, 1],
                    }
              }
              transition={{
                duration: 35,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ backgroundColor: colors[3] }}
              className="absolute bottom-[10%] right-[20%] h-[50%] w-[50%] rounded-full opacity-60 mix-blend-multiply blur-[80px] dark:mix-blend-screen md:blur-[120px]"
            />
          </div>
        </div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
