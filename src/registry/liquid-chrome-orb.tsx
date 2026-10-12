"use client";
// Built on the shaders library (MIT, © 2026 Shader Effects Inc.).

import { useReducedMotion } from "framer-motion";
import { LiquidMetal, Shader, StudioBackground } from "shaders/react";
import { cn } from "@/lib/utils";

export interface LiquidChromeOrbProps {
  shape?: "torus" | "sphere" | "blob";
  lightColor?: string;
  darkColor?: string;
  backgroundColor?: string;
  speed?: number;
  turbulence?: number;
  dispersion?: number;
  scale?: number;
  className?: string;
}

const SHAPES = {
  torus: { type: "torus3D", radius: 0.3, tube: 0.12, rotX: 55, rotY: 0, rotZ: 0 },
  sphere: { type: "sphere3D", radius: 0.35 },
  blob: { type: "blob3D", radius: 0.35 },
} as const;

export function LiquidChromeOrb({
  shape = "torus",
  lightColor = "#eef0f6",
  darkColor = "#141414",
  backgroundColor = "#0b0b0f",
  speed = 1,
  turbulence = 1,
  dispersion = 0.6,
  scale = 1,
  className,
}: LiquidChromeOrbProps) {
  const reduce = useReducedMotion();
  return (
    <Shader className={cn("absolute inset-0 h-full w-full", className)}>
      <StudioBackground color={backgroundColor} brightness={15} ambientSpeed={reduce ? 0 : 0.5} />
      <LiquidMetal
        shape={SHAPES[shape]}
        lightColor={lightColor}
        darkColor={darkColor}
        speed={reduce ? 0 : speed}
        turbulence={turbulence}
        dispersion={dispersion}
        scale={scale}
      />
    </Shader>
  );
}
