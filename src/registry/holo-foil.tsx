"use client";
// Built on the shaders library (MIT, © 2026 Shader Effects Inc.).

import { useReducedMotion } from "framer-motion";
import { FilmGrain, Holographic, LinearGradient, Shader } from "shaders/react";
import { cn } from "@/lib/utils";

export interface HoloFoilProps {
  backgroundFrom?: string;
  backgroundTo?: string;
  speed?: number;
  saturation?: number;
  sparkle?: number;
  crinkle?: number;
  width?: number;
  height?: number;
  rounding?: number;
  className?: string;
}

export function HoloFoil({
  backgroundFrom = "#18181b",
  backgroundTo = "#09090b",
  speed = 1,
  saturation = 0.75,
  sparkle = 0.4,
  crinkle = 0.5,
  width = 0.32,
  height = 0.42,
  rounding = 0.06,
  className,
}: HoloFoilProps) {
  const reduce = useReducedMotion();
  return (
    <Shader className={cn("absolute inset-0 h-full w-full", className)}>
      <LinearGradient
        colorA={backgroundFrom}
        colorB={backgroundTo}
        angle={135}
        colorSpace="oklab"
      />
      <Holographic
        shape={{ type: "roundedRectSDF", width, height, rounding }}
        speed={reduce ? 0 : speed}
        saturation={saturation}
        sparkle={sparkle}
        crinkle={crinkle}
      />
      <FilmGrain strength={0.05} animated={!reduce} />
    </Shader>
  );
}
