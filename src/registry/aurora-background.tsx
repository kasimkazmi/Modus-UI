"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  children,
  className,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col w-full h-[100vh] items-center justify-center bg-background text-foreground transition-bg overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={cn(
            "absolute inset-0 will-change-transform",
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]`
          )}
        >
          <div className="absolute inset-0 opacity-50 dark:opacity-80 mix-blend-normal dark:mix-blend-lighten">
            {/* Animated Blob 1 */}
            <motion.div
              animate={{
                x: ["0%", "20%", "-20%", "0%"],
                y: ["0%", "-20%", "20%", "0%"],
                scale: [1, 1.2, 0.8, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-[#38bdf8] rounded-full mix-blend-multiply dark:mix-blend-screen blur-[80px] md:blur-[120px] opacity-70"
            />

            {/* Animated Blob 2 */}
            <motion.div
              animate={{
                x: ["0%", "-20%", "20%", "0%"],
                y: ["0%", "20%", "-20%", "0%"],
                scale: [1, 0.8, 1.2, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute top-[10%] -right-[10%] w-[50%] h-[50%] bg-[#818cf8] rounded-full mix-blend-multiply dark:mix-blend-screen blur-[80px] md:blur-[120px] opacity-70"
            />

            {/* Animated Blob 3 */}
            <motion.div
              animate={{
                x: ["0%", "30%", "-30%", "0%"],
                y: ["0%", "30%", "-30%", "0%"],
                scale: [1, 1.3, 0.7, 1],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] bg-[#34d399] rounded-full mix-blend-multiply dark:mix-blend-screen blur-[80px] md:blur-[120px] opacity-70"
            />

            {/* Animated Blob 4 (Extra for richness) */}
            <motion.div
              animate={{
                x: ["0%", "-30%", "30%", "0%"],
                y: ["0%", "-30%", "30%", "0%"],
                scale: [1, 0.9, 1.1, 1],
              }}
              transition={{
                duration: 35,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute bottom-[10%] right-[20%] w-[50%] h-[50%] bg-[#e879f9] rounded-full mix-blend-multiply dark:mix-blend-screen blur-[80px] md:blur-[120px] opacity-60"
            />
          </div>
        </div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
