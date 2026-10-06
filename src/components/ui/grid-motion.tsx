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
  combinedItems 
}: { 
  rowIndex: number; 
  smoothX: any; 
  combinedItems: React.ReactNode[] 
}) {
  const direction = rowIndex % 2 === 0 ? 1 : -1;
  const inertiaFactor = [0.6, 0.4, 0.3, 0.2][rowIndex % 4];
  const maxMoveAmount = 300;

  // Now useTransform is called at the top level of a component!
  const x = useTransform(smoothX, (currentX: number) => {
    if (typeof window === "undefined") return 0;
    const moveAmount = ((currentX / window.innerWidth) * maxMoveAmount - maxMoveAmount / 2) * direction;
    return moveAmount * inertiaFactor;
  });

  return (
    <motion.div className="grid gap-4 grid-cols-7" style={{ x }}>
      {[...Array(7)].map((_, itemIndex) => {
        const content = combinedItems[rowIndex * 7 + itemIndex];
        return (
          <div key={itemIndex} className="relative">
            <div className="relative w-full h-full overflow-hidden rounded-[16px] bg-card border border-border flex items-center justify-center text-foreground text-[1.5rem] shadow-sm hover:scale-[1.02] transition-transform duration-300 cursor-default">
              {typeof content === 'string' && content.startsWith('http') ? (
                <div
                  className="w-full h-full bg-cover bg-center absolute top-0 left-0"
                  style={{ backgroundImage: `url(${content})` }}
                />
              ) : (
                <div className="p-4 text-center z-[1]">{content}</div>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

export function GridMotion({ items = [], className, gradientColor = "var(--background)" }: GridMotionProps) {
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
    <div ref={containerRef} className={cn("h-full w-full overflow-hidden bg-background", className)}>
      <section
        className="w-full h-screen overflow-hidden relative flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`
        }}
      >
        <div className="absolute inset-0 pointer-events-none z-[4] bg-[length:250px]"></div>
        <div className="gap-4 flex-none relative w-[150vw] h-[150vh] grid grid-rows-4 grid-cols-1 rotate-[-15deg] origin-center z-[2]">
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
