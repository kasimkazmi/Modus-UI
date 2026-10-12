"use client";
// Built on the shaders library (MIT, © 2026 Shader Effects Inc.).

import { useReducedMotion } from "framer-motion";
import { Crystal, Shader, Vignette, Voronoi } from "shaders/react";
import { cn } from "@/lib/utils";

export interface CrystalCellsProps {
  colorA?: string;
  colorB?: string;
  borderColor?: string;
  speed?: number;
  scale?: number;
  facets?: number;
  refraction?: number;
  dispersion?: number;
  radius?: number;
  className?: string;
}

export function CrystalCells({
  colorA = "#0f172a",
  colorB = "#6366f1",
  borderColor = "#e0e7ff",
  speed = 0.5,
  scale = 6,
  facets = 5,
  refraction = 0.5,
  dispersion = 0.5,
  radius = 0.32,
  className,
}: CrystalCellsProps) {
  const reduce = useReducedMotion();
  return (
    <Shader className={cn("absolute inset-0 h-full w-full", className)}>
      <Voronoi
        colorA={colorA}
        colorB={colorB}
        colorBorder={borderColor}
        colorSpace="oklch"
        scale={scale}
        speed={reduce ? 0 : speed}
        edgeIntensity={0.6}
      />
      <Crystal
        shape={{ type: "polygonSDF", radius, sides: 6, rounding: 0 }}
        facets={facets}
        refraction={refraction}
        dispersion={dispersion}
      />
      <Vignette color="#000000" intensity={0.5} radius={0.75} />
    </Shader>
  );
}
