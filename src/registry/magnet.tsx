"use client";
// Pulls its child toward the cursor once the cursor comes within `padding` pixels.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MagnetProps {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  wrapperClassName?: string;
  innerClassName?: string;
}

export function Magnet({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 2,
  activeTransition = "transform 0.3s ease-out",
  inactiveTransition = "transform 0.5s ease-in-out",
  wrapperClassName = "",
  innerClassName = "",
}: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [pull, setPull] = useState<{ x: number; y: number } | null>(null);
  const off = disabled || reduceMotion;

  useEffect(() => {
    if (off) {
      setPull(null);
      return;
    }
    const onMove = (event: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const inRange =
        event.clientX > box.left - padding &&
        event.clientX < box.right + padding &&
        event.clientY > box.top - padding &&
        event.clientY < box.bottom + padding;
      setPull(
        inRange
          ? {
              x: (event.clientX - (box.left + box.width / 2)) / magnetStrength,
              y: (event.clientY - (box.top + box.height / 2)) / magnetStrength,
            }
          : null,
      );
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [off, padding, magnetStrength]);

  return (
    <div ref={ref} className={cn("relative inline-block", wrapperClassName)}>
      <div
        className={cn("will-change-transform", innerClassName)}
        style={{
          transform: `translate3d(${pull?.x ?? 0}px, ${pull?.y ?? 0}px, 0)`,
          transition: pull ? activeTransition : inactiveTransition,
        }}
      >
        {children}
      </div>
    </div>
  );
}
