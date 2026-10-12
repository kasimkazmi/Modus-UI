"use client";
// Built on the shaders library (MIT, © 2026 Shader Effects Inc.).

import { InkFlow, Glow, Shader, SolidColor } from "shaders/react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface InkCanvasProps {
  backgroundColor?: string;
  colorMode?: "rainbow" | "single";
  color?: string;
  radius?: number;
  curl?: number;
  decay?: number;
  glow?: number;
  className?: string;
}

export function InkCanvas({
  backgroundColor = "#07070b",
  colorMode = "rainbow",
  color = "#ff2d7e",
  radius = 1,
  curl = 0.5,
  decay = 0.6,
  glow = 0.4,
  className,
}: InkCanvasProps) {
  // Reduced motion keeps the ink where it is drawn instead of swirling it.
  const reduce = useReducedMotion();
  return (
    <Shader className={cn("absolute inset-0 h-full w-full", className)}>
      <SolidColor color={backgroundColor} />
      <InkFlow
        colorMode={colorMode}
        color={color}
        radius={radius}
        curl={reduce ? 0 : curl}
        decay={decay}
      />
      <Glow intensity={glow} threshold={0.3} size={16} />
    </Shader>
  );
}
