"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const useMedia = (queries: string[], values: number[], defaultValue: number) => {
  const get = () => {
    if (typeof window === "undefined") return defaultValue;
    return values[queries.findIndex((q) => window.matchMedia(q).matches)] ?? defaultValue;
  };

  const [value, setValue] = useState(get);

  useEffect(() => {
    const mediaQueries = queries.map((q) => window.matchMedia(q));
    const handler = () => setValue(get);
    mediaQueries.forEach((query) => query.addEventListener("change", handler));
    return () => mediaQueries.forEach((query) => query.removeEventListener("change", handler));
  }, [queries]);

  return value;
};

const useMeasure = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
};

export interface MasonryItem {
  id: string | number;
  height: number;
  content: React.ReactNode;
}

export interface MasonryGridProps {
  items: MasonryItem[];
  animateFrom?: "top" | "bottom" | "left" | "right" | "center" | "random";
  stagger?: number;
  className?: string;
}

export function MasonryGrid({
  items,
  animateFrom = "bottom",
  stagger = 0.05,
  className,
}: MasonryGridProps) {
  const columns = useMedia(
    ["(min-width: 1500px)", "(min-width: 1000px)", "(min-width: 600px)", "(min-width: 400px)"],
    [5, 4, 3, 2],
    1
  );

  const [containerRef, { width }] = useMeasure();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const grid = useMemo(() => {
    if (!width) return [];
    const colHeights = new Array(columns).fill(0);
    const gap = 16;
    const totalGaps = (columns - 1) * gap;
    const columnWidth = (width - totalGaps) / columns;

    return items.map((child) => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (columnWidth + gap);
      const height = child.height;
      const y = colHeights[col];

      colHeights[col] += height + gap;
      return { ...child, x, y, w: columnWidth, h: height };
    });
  }, [columns, items, width]);

  const getInitialPosition = (item: any) => {
    if (typeof window === "undefined") return { x: item.x, y: item.y };
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: item.x, y: item.y };

    let direction = animateFrom;
    if (animateFrom === "random") {
      const dirs = ["top", "bottom", "left", "right"];
      direction = dirs[Math.floor(Math.random() * dirs.length)] as any;
    }

    switch (direction) {
      case "top":
        return { x: item.x, y: -200 };
      case "bottom":
        return { x: item.x, y: window.innerHeight + 200 };
      case "left":
        return { x: -200, y: item.y };
      case "right":
        return { x: window.innerWidth + 200, y: item.y };
      case "center":
        return {
          x: containerRect.width / 2 - item.w / 2,
          y: containerRect.height / 2 - item.h / 2,
        };
      default:
        return { x: item.x, y: item.y + 100 };
    }
  };

  const containerHeight = Math.max(...grid.map((i) => i.y + i.h), 0);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      style={{ height: containerHeight > 0 ? containerHeight : "100vh" }}
    >
      <AnimatePresence>
        {mounted && width > 0 &&
          grid.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{
                opacity: 0,
                ...getInitialPosition(item),
                width: item.w,
                height: item.h,
                filter: "blur(10px)",
              }}
              animate={{
                opacity: 1,
                x: item.x,
                y: item.y,
                width: item.w,
                height: item.h,
                filter: "blur(0px)",
              }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                opacity: { duration: 0.5, delay: index * stagger },
                filter: { duration: 0.5, delay: index * stagger },
                layout: { type: "spring", stiffness: 300, damping: 30 },
              }}
              className="absolute box-border overflow-hidden"
              whileHover={{ scale: 0.98 }}
            >
              {item.content}
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}
