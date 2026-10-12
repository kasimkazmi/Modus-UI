"use client";
// Built on the shaders library (MIT, © 2026 Shader Effects Inc.).

import { useReducedMotion } from "framer-motion";
import { Aurora, FilmGrain, Shader, SimplexNoise, SolidColor, Vignette } from "shaders/react";
import { cn } from "@/lib/utils";

export interface AuroraVeilProps {
  colorA?: string;
  colorB?: string;
  colorC?: string;
  backgroundColor?: string;
  speed?: number;
  intensity?: number;
  curtainCount?: number;
  waviness?: number;
  grain?: number;
  className?: string;
}

export function AuroraVeil({
  colorA = "#22d3ee",
  colorB = "#a855f7",
  colorC = "#34d399",
  backgroundColor = "#030712",
  speed = 5,
  intensity = 80,
  curtainCount = 4,
  waviness = 50,
  grain = 0.08,
  className,
}: AuroraVeilProps) {
  const reduce = useReducedMotion();
  return (
    <Shader className={cn("absolute inset-0 h-full w-full", className)}>
      <SolidColor color={backgroundColor} />
      <Aurora
        colorA={colorA}
        colorB={colorB}
        colorC={colorC}
        colorSpace="oklab"
        speed={reduce ? 0 : speed}
        intensity={intensity}
        curtainCount={curtainCount}
        waviness={waviness}
      />
      <SimplexNoise
        colorA="#000000"
        colorB="#ffffff"
        scale={3}
        speed={reduce ? 0 : 0.3}
        opacity={0.12}
        blendMode="softLight"
      />
      <FilmGrain strength={grain} animated={!reduce} />
      <Vignette color={backgroundColor} intensity={0.6} radius={0.7} />
    </Shader>
  );
}
