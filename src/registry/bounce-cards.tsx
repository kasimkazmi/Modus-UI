"use client";
// A fanned stack of photo cards that springs in and parts around the hovered card.

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const DEFAULT_TRANSFORMS = [
  "rotate(10deg) translate(-170px)",
  "rotate(5deg) translate(-85px)",
  "rotate(-3deg)",
  "rotate(-10deg) translate(85px)",
  "rotate(2deg) translate(170px)",
];

const PUSH = 140;

function parsePose(transform: string) {
  const rotate = Number(transform.match(/rotate\((-?[\d.]+)deg\)/)?.[1] ?? 0);
  const x = Number(transform.match(/translate(?:X)?\((-?[\d.]+)px/)?.[1] ?? 0);
  return { rotate, x };
}

export interface BounceCardsProps {
  images?: string[];
  containerWidth?: number | string;
  containerHeight?: number | string;
  animationDelay?: number;
  animationStagger?: number;
  enableHover?: boolean;
  transformStyles?: string[];
  className?: string;
}

export function BounceCards({
  images = [],
  containerWidth = 400,
  containerHeight = 400,
  animationDelay = 0.5,
  animationStagger = 0.06,
  enableHover = false,
  transformStyles = DEFAULT_TRANSFORMS,
  className,
}: BounceCardsProps) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: containerWidth, height: containerHeight }}
      onMouseLeave={() => setActive(null)}
    >
      {images.map((src, i) => {
        const pose = parsePose(transformStyles[i] ?? "");
        const focused = active === i;
        const shift = active === null || focused ? 0 : i < active ? -PUSH : PUSH;

        return (
          <motion.div
            key={i}
            className="absolute aspect-square w-[200px] overflow-hidden rounded-[28px] border-8 border-card bg-muted shadow-xl"
            initial={reduceMotion ? false : { scale: 0, rotate: pose.rotate, x: pose.x }}
            animate={{
              scale: 1,
              rotate: focused ? 0 : pose.rotate,
              x: pose.x + shift,
              zIndex: focused ? images.length : i,
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    type: "spring",
                    stiffness: 260,
                    damping: 14,
                    scale: {
                      type: "spring",
                      stiffness: 300,
                      damping: 11,
                      delay: animationDelay + i * animationStagger,
                    },
                  }
            }
            onMouseEnter={enableHover ? () => setActive(i) : undefined}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              className="m-0 block h-full w-full object-cover"
            />
          </motion.div>
        );
      })}
    </div>
  );
}
