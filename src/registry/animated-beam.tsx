"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";

interface AnimatedBeamProps {
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  pathColor?: string;
  gradientStart?: string;
  gradientStop?: string;
  className?: string;
}

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 3,
  delay = 0,
  pathColor = "hsl(var(--border))",
  gradientStart = "hsl(var(--primary))",
  gradientStop = "hsl(var(--primary))",
  className = "",
}: AnimatedBeamProps) {
  const gradientId = useId();
  const [path, setPath] = useState("");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const prefersReducedMotion = useReducedMotion();

  const measure = useCallback(() => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    if (!container || !from || !to) return;

    const containerRect = container.getBoundingClientRect();
    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();

    setSize({ width: containerRect.width, height: containerRect.height });

    const startX = fromRect.left - containerRect.left + fromRect.width / 2;
    const startY = fromRect.top - containerRect.top + fromRect.height / 2;
    const endX = toRect.left - containerRect.left + toRect.width / 2;
    const endY = toRect.top - containerRect.top + toRect.height / 2;

    const controlX = (startX + endX) / 2;
    const controlY = (startY + endY) / 2 - curvature;

    setPath(`M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`);
  }, [containerRef, fromRef, toRef, curvature]);

  useEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    if (fromRef.current) observer.observe(fromRef.current);
    if (toRef.current) observer.observe(toRef.current);

    return () => observer.disconnect();
  }, [measure, containerRef, fromRef, toRef]);

  if (!path) return null;

  return (
    <svg
      fill="none"
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      aria-hidden="true"
      className={cn("pointer-events-none absolute left-0 top-0 overflow-visible", className)}
    >
      <path d={path} stroke={pathColor} strokeWidth={2} strokeLinecap="round" strokeOpacity={0.4} />
      <path d={path} stroke={`url(#${gradientId})`} strokeWidth={2} strokeLinecap="round" />
      <defs>
        <motion.linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
          animate={
            prefersReducedMotion
              ? { x1: "0%", x2: "100%", y1: "0%", y2: "0%" }
              : {
                  x1: reverse ? ["100%", "-10%"] : ["-10%", "100%"],
                  x2: reverse ? ["110%", "0%"] : ["0%", "110%"],
                  y1: ["0%", "0%"],
                  y2: ["0%", "0%"],
                }
          }
          transition={{
            duration,
            delay,
            repeat: prefersReducedMotion ? 0 : Infinity,
            repeatDelay: 0.4,
            ease: "easeInOut",
          }}
        >
          <stop stopColor={gradientStart} stopOpacity="0" />
          <stop stopColor={gradientStart} />
          <stop offset="32.5%" stopColor={gradientStop} />
          <stop offset="100%" stopColor={gradientStop} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}
