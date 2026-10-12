"use client";
// Built on the shaders library (MIT, © 2026 Shader Effects Inc.).

import { useReducedMotion } from "framer-motion";
import { CursorRipples, Shader, Swirl } from "shaders/react";
import { cn } from "@/lib/utils";

export interface RipplePoolProps {
  colorA?: string;
  colorB?: string;
  speed?: number;
  detail?: number;
  intensity?: number;
  radius?: number;
  decay?: number;
  chromaticSplit?: number;
  className?: string;
}

export function RipplePool({
  colorA = "#04121f",
  colorB = "#38bdf8",
  speed = 0.5,
  detail = 1,
  intensity = 10,
  radius = 0.5,
  decay = 10,
  chromaticSplit = 1,
  className,
}: RipplePoolProps) {
  const reduce = useReducedMotion();
  const classes = cn("absolute inset-0 h-full w-full", className);
  return (
    <Shader className={classes}>
      <Swirl
        colorA={colorA}
        colorB={colorB}
        colorSpace="oklab"
        speed={reduce ? 0 : speed}
        detail={detail}
      />
      <CursorRipples
        intensity={intensity}
        radius={radius}
        decay={decay}
        chromaticSplit={chromaticSplit}
      />
    </Shader>
  );
}
