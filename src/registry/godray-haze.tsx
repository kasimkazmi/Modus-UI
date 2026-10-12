"use client";
// Built on the shaders library (MIT, © 2026 Shader Effects Inc.).

import { useReducedMotion } from "framer-motion";
import { FractalNoise, Godrays, LinearGradient, Shader, Vignette } from "shaders/react";
import { cn } from "@/lib/utils";

export interface GodrayHazeProps {
  rayColor?: string;
  skyColor?: string;
  groundColor?: string;
  speed?: number;
  intensity?: number;
  density?: number;
  spotty?: number;
  className?: string;
}

export function GodrayHaze({
  rayColor = "#fde68a",
  skyColor = "#1e293b",
  groundColor = "#020617",
  speed = 0.5,
  intensity = 0.6,
  density = 0.3,
  spotty = 1,
  className,
}: GodrayHazeProps) {
  const reduce = useReducedMotion();
  return (
    <Shader className={cn("absolute inset-0 h-full w-full", className)}>
      <LinearGradient colorA={skyColor} colorB={groundColor} angle={180} colorSpace="oklab" />
      <Godrays
        center={{ x: 0.2, y: 0 }}
        rayColor={rayColor}
        backgroundColor="transparent"
        speed={reduce ? 0 : speed}
        intensity={intensity}
        density={density}
        spotty={spotty}
        blendMode="screen"
      />
      <FractalNoise
        colorA="#000000"
        colorB="#ffffff"
        speed={reduce ? 0 : 0.2}
        opacity={0.15}
        blendMode="softLight"
      />
      <Vignette color={groundColor} intensity={0.5} radius={0.8} />
    </Shader>
  );
}
