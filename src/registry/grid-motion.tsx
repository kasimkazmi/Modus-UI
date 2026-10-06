"use client";

import React, { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GridMotionProps {
  items?: React.ReactNode[];
  className?: string;
  gradientColor?: string;
}

function GridRow({
  rowIndex,
  smoothX,
  combinedItems,
}: {
  rowIndex: number;
  smoothX: any;
  combinedItems: React.ReactNode[];
}) {
  const direction = rowIndex % 2 === 0 ? 1 : -1;
  const inertiaFactor = [0.6, 0.4, 0.3, 0.2][rowIndex % 4];
  const maxMoveAmount = 300;

  // Now useTransform is called at the top level of a component!
  const x = useTransform(smoothX, (currentX: number) => {
    if (typeof window === "undefined") return 0;
    const moveAmount =
      ((currentX / window.innerWidth) * maxMoveAmount - maxMoveAmount / 2) * direction;
    return moveAmount * inertiaFactor;
  });

  return (
    <motion.div className="grid grid-cols-7 gap-4" style={{ x }}>
      {[...Array(7)].map((_, itemIndex) => {
        const content = combinedItems[rowIndex * 7 + itemIndex];
        return (
          <div key={itemIndex} className="relative">
            <div className="relative flex h-full w-full cursor-default items-center justify-center overflow-hidden rounded-[16px] border border-border bg-card text-[1.5rem] text-foreground shadow-sm transition-transform duration-300 hover:scale-[1.02]">
              {typeof content === "string" && content.startsWith("http") ? (
                <div
                  className="absolute left-0 top-0 h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${content})` }}
                />
              ) : (
                <div className="z-[1] p-4 text-center">{content}</div>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

export function GridMotion({
  items = [],
  className,
  gradientColor = "hsl(var(--background))",
}: GridMotionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Create an array of 28 items minimum
  const totalItems = 28;
  const defaultItems = Array.from({ length: totalItems }, (_, index) => `Item ${index + 1}`);
  const combinedItems = items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  const mouseX = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full overflow-hidden bg-background", className)}
    >
      <section
        className="relative flex h-screen w-full items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 z-[4] bg-[length:250px]"></div>
        <div className="relative z-[2] grid h-[150vh] w-[150vw] flex-none origin-center rotate-[-15deg] grid-cols-1 grid-rows-4 gap-4">
          {[...Array(4)].map((_, rowIndex) => (
            <GridRow
              key={rowIndex}
              rowIndex={rowIndex}
              smoothX={smoothX}
              combinedItems={combinedItems}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
