"use client";
// A tilted wall of tiles whose rows drift with the pointer, each row on its own lagging spring.

import { useEffect } from "react";
import type React from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

const ROWS = 4;
const COLS = 7;
const TRAVEL = 220;

export interface GridMotionProps {
  items?: React.ReactNode[];
  gradientColor?: string;
  className?: string;
}

function Row({
  pointer,
  index,
  cells,
}: {
  pointer: MotionValue<number>;
  index: number;
  cells: React.ReactNode[];
}) {
  const direction = index % 2 === 0 ? 1 : -1;
  const target = useTransform(pointer, (p) => p * TRAVEL * direction);
  const x = useSpring(target, { stiffness: 40 - index * 7, damping: 18, mass: 1 + index * 0.3 });

  return (
    <motion.div className="grid grid-cols-7 gap-4" style={{ x }}>
      {cells.map((cell, i) => (
        <div
          key={i}
          className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-card p-4 text-center font-sans text-lg text-card-foreground shadow-sm"
        >
          {cell}
        </div>
      ))}
    </motion.div>
  );
}

export function GridMotion({
  items = [],
  gradientColor = "hsl(var(--background))",
  className,
}: GridMotionProps) {
  const reduceMotion = useReducedMotion();
  const pointer = useMotionValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e: PointerEvent) => pointer.set((e.clientX / window.innerWidth) * 2 - 1);
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [pointer, reduceMotion]);

  const cells = Array.from({ length: ROWS * COLS }, (_, i) =>
    items.length ? items[i % items.length] : null,
  );

  return (
    <section
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: `radial-gradient(circle, ${gradientColor} 0%, hsl(var(--muted)) 100%)` }}
    >
      <div className="absolute left-1/2 top-1/2 flex w-[150%] -translate-x-1/2 -translate-y-1/2 -rotate-[15deg] flex-col gap-4">
        {Array.from({ length: ROWS }, (_, r) => (
          <Row key={r} index={r} pointer={pointer} cells={cells.slice(r * COLS, r * COLS + COLS)} />
        ))}
      </div>
    </section>
  );
}
