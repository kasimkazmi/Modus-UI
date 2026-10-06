"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BounceCardsProps {
  className?: string;
  images?: string[];
  containerWidth?: number | string;
  containerHeight?: number | string;
  animationDelay?: number;
  animationStagger?: number;
  enableHover?: boolean;
  transformStyles?: string[];
}

export function BounceCards({
  className,
  images = [],
  containerWidth = 400,
  containerHeight = 400,
  animationDelay = 0.5,
  animationStagger = 0.06,
  enableHover = false,
  transformStyles = [
    "rotate(10deg) translate(-170px)",
    "rotate(5deg) translate(-85px)",
    "rotate(-3deg)",
    "rotate(-10deg) translate(85px)",
    "rotate(2deg) translate(170px)",
  ],
}: BounceCardsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // Reduced motion: cards start in place and hover rearrangements snap instantly.
  const prefersReducedMotion = useReducedMotion();

  const getTransform = (index: number, baseTransform: string) => {
    if (!enableHover || hoveredIndex === null) return baseTransform;

    if (hoveredIndex === index) {
      // Straighten out the hovered card
      return baseTransform.replace(/rotate\([\s\S]*?\)/, "rotate(0deg)");
    }

    // Push sibling cards away
    const pushOffset = index < hoveredIndex ? -160 : 160;
    const translateRegex = /translate\(([-0-9.]+)px\)/;
    const match = baseTransform.match(translateRegex);

    if (match) {
      const currentX = parseFloat(match[1]);
      return baseTransform.replace(translateRegex, `translate(${currentX + pushOffset}px)`);
    }

    return baseTransform === "none"
      ? `translate(${pushOffset}px)`
      : `${baseTransform} translate(${pushOffset}px)`;
  };

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {images.map((src, idx) => {
        const baseTransform = transformStyles[idx] || "none";
        const currentTransform = getTransform(idx, baseTransform);
        // Calculate dynamic delay based on distance from hovered item
        const distance = hoveredIndex !== null ? Math.abs(hoveredIndex - idx) : 0;
        const pushDelay = distance * 0.05;

        return (
          <motion.div
            key={idx}
            className="absolute aspect-square w-[200px] overflow-hidden rounded-[30px] border-8 border-background shadow-xl"
            initial={prefersReducedMotion ? false : { scale: 0 }}
            animate={{
              scale: 1,
              transform: currentTransform,
            }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    scale: {
                      type: "spring",
                      bounce: 0.5,
                      delay: animationDelay + idx * animationStagger,
                    },
                    transform: {
                      type: "spring",
                      bounce: 0.4,
                      delay: hoveredIndex !== null ? pushDelay : 0,
                    },
                  }
            }
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="h-full w-full object-cover" src={src} alt={`card-${idx}`} />
          </motion.div>
        );
      })}
    </div>
  );
}
