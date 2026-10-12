"use client";
// Built on the shaders library (MIT, © 2026 Shader Effects Inc.).

import { useReducedMotion } from "framer-motion";
import { ChromaticAberration, Glow, Plasma, Shader, Vignette } from "shaders/react";
import { cn } from "@/lib/utils";

export interface PlasmaGlowProps {
  colorA?: string;
  colorB?: string;
  speed?: number;
  density?: number;
  warp?: number;
  glow?: number;
  aberration?: number;
  className?: string;
}

export function PlasmaGlow({
  colorA = "#0b0221",
  colorB = "#ff3fa4",
  speed = 1,
  density = 1,
  warp = 1,
  glow = 0.6,
  aberration = 0.3,
  className,
}: PlasmaGlowProps) {
  const reduce = useReducedMotion();
  return (
    <Shader className={cn("absolute inset-0 h-full w-full", className)}>
      <Plasma
        colorA={colorA}
        colorB={colorB}
        colorSpace="oklch"
        speed={reduce ? 0 : speed}
        density={density}
        warp={warp}
      />
      <Glow intensity={glow} threshold={0.4} size={20} />
      <ChromaticAberration strength={aberration} />
      <Vignette color="#000000" intensity={0.5} radius={0.75} />
    </Shader>
  );
}
