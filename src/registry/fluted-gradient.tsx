"use client";
// Built on the shaders library (MIT, © 2026 Shader Effects Inc.).

import { useReducedMotion } from "framer-motion";
import { FilmGrain, FlowingGradient, FlutedGlass, Shader } from "shaders/react";
import { cn } from "@/lib/utils";

export interface FlutedGradientProps {
  colorA?: string;
  colorB?: string;
  colorC?: string;
  colorD?: string;
  speed?: number;
  distortion?: number;
  frequency?: number;
  angle?: number;
  refraction?: number;
  aberration?: number;
  className?: string;
}

export function FlutedGradient({
  colorA = "#0b1026",
  colorB = "#ff6b3d",
  colorC = "#7c3aed",
  colorD = "#22d3ee",
  speed = 0.6,
  distortion = 0.8,
  frequency = 10,
  angle = 0,
  refraction = 1.5,
  aberration = 0.2,
  className,
}: FlutedGradientProps) {
  const reduce = useReducedMotion();
  const classes = cn("absolute inset-0 h-full w-full", className);
  return (
    <Shader className={classes}>
      <FlowingGradient
        colorA={colorA}
        colorB={colorB}
        colorC={colorC}
        colorD={colorD}
        colorSpace="oklab"
        speed={reduce ? 0 : speed}
        distortion={distortion}
      />
      <FlutedGlass
        frequency={frequency}
        angle={angle}
        refraction={refraction}
        aberration={aberration}
        speed={reduce ? 0 : 1}
      />
      <FilmGrain strength={0.05} animated={!reduce} />
    </Shader>
  );
}
