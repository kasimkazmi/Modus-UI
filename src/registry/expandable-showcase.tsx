"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ShowcaseItem {
  id: string | number;
  image: string;
  label: string;
  link?: string;
  alt?: string;
}

export interface ExpandableShowcaseProps extends React.HTMLAttributes<HTMLDivElement> {
  items: ShowcaseItem[];
  defaultIndex?: number;
  orientation?: "horizontal" | "vertical";
  height?: number | string;
  gap?: number;
  className?: string;
}

export function ExpandableShowcase({
  items,
  defaultIndex = 0,
  orientation = "horizontal",
  height = 460,
  gap = 12,
  className,
  ...props
}: ExpandableShowcaseProps) {
  const [active, setActive] = useState(defaultIndex);
  const prefersReducedMotion = useReducedMotion();
  const instant = { duration: 0 };

  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn("flex w-full overflow-hidden", isVertical ? "flex-col" : "flex-row", className)}
      style={{
        height: isVertical ? "auto" : height,
        minHeight: isVertical ? height : "auto",
        gap,
      }}
      role="list"
      aria-label="Expandable image gallery"
      {...props}
    >
      {items.map((item, i) => {
        const isActive = i === active;

        // Use motion.a if link is provided, otherwise motion.div
        const Tag = item.link ? motion.a : motion.div;

        return (
          <Tag
            key={item.id}
            href={item.link}
            onClick={() => setActive(i)}
            onFocus={() => setActive(i)}
            onMouseEnter={() => setActive(i)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActive(i);
                if (item.link) {
                  window.location.href = item.link;
                }
              } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i + 1) % items.length);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i - 1 + items.length) % items.length);
              }
            }}
            tabIndex={0}
            role="listitem"
            aria-expanded={isActive}
            className="group relative cursor-pointer overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            animate={{
              flexGrow: isActive ? 4 : 1,
              flexShrink: isActive ? 0 : 1,
              flexBasis: isActive ? (isVertical ? "40%" : "40%") : "15%",
            }}
            transition={
              prefersReducedMotion ? instant : { type: "spring", stiffness: 200, damping: 25 }
            }
            style={{
              minHeight: isVertical ? 80 : "auto",
            }}
          >
            {/* Image Layer */}
            <motion.div
              className="absolute inset-0 h-full w-full"
              animate={{
                filter: isActive ? "grayscale(0%)" : "grayscale(80%)",
              }}
              transition={prefersReducedMotion ? instant : { duration: 0.4 }}
            >
              <img
                src={item.image}
                alt={item.alt || item.label}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            </motion.div>

            {/* Gradient Overlay for Text Readability */}
            <motion.div
              className="absolute inset-0"
              animate={{
                background: isActive
                  ? "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)"
                  : "linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)",
              }}
              transition={prefersReducedMotion ? instant : { duration: 0.4 }}
            />

            {/* Label and Indicator */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4">
              <motion.div
                className="h-6 w-1 rounded-full bg-primary"
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0,
                  x: isActive || prefersReducedMotion ? 0 : -10,
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.15 }
                    : { duration: 0.3, delay: isActive ? 0.1 : 0 }
                }
              />
              <motion.span
                className="truncate text-lg font-bold text-white drop-shadow-md"
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0,
                  x: isActive || prefersReducedMotion ? 0 : -10,
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.15 }
                    : { duration: 0.3, delay: isActive ? 0.15 : 0 }
                }
              >
                {item.label}
              </motion.span>
            </div>
          </Tag>
        );
      })}
    </div>
  );
}
