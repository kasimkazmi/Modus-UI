"use client";
// Built on the shaders library (MIT, © 2026 Shader Effects Inc.).

import { useReducedMotion } from "framer-motion";
import { DotGrid, Nebula, RadialGradient, Shader } from "shaders/react";
import { cn } from "@/lib/utils";

export interface NebulaOrbProps {
  coreColor?: string;
  gasColor?: string;
  veilColor?: string;
  backgroundColor?: string;
  speed?: number;
  density?: number;
  glow?: number;
  radius?: number;
  className?: string;
}

export function NebulaOrb({
  coreColor = "#ffd9b0",
  gasColor = "#ff5e7a",
  veilColor = "#3a5bdb",
  backgroundColor = "#05030f",
  speed = 1,
  density = 1,
  glow = 1,
  radius = 0.38,
  className,
}: NebulaOrbProps) {
  const reduce = useReducedMotion();
  return (
    <Shader className={cn("absolute inset-0 h-full w-full", className)}>
      <RadialGradient colorA="#1b1145" colorB={backgroundColor} radius={0.9} colorSpace="oklab" />
      <DotGrid
        color="#ffffff"
        density={60}
        dotSize={0.08}
        twinkle={1}
        speed={reduce ? 0 : 1}
        opacity={0.35}
      />
      <Nebula
        shape={{ type: "sphere3D", radius }}
        coreColor={coreColor}
        gasColor={gasColor}
        veilColor={veilColor}
        speed={reduce ? 0 : speed}
        density={density}
        glow={glow}
      />
    </Shader>
  );
}
