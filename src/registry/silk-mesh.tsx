"use client";
// Built on the shaders library (MIT, © 2026 Shader Effects Inc.).

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { FilmGrain, MeshGradient, Shader, SimplexNoise } from "shaders/react";
import { cn } from "@/lib/utils";

type Theme = { primary: string; accent: string; background: string; foreground: string };

function readTheme(): Theme {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => `hsl(${style.getPropertyValue(name).trim()})`;
  return {
    primary: token("--primary"),
    accent: token("--accent"),
    background: token("--background"),
    foreground: token("--foreground"),
  };
}

function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    const update = () => setTheme(readTheme());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}

export interface SilkMeshProps {
  colorA?: string;
  colorB?: string;
  speed?: number;
  count?: number;
  swirl?: number;
  smoothness?: number;
  grain?: number;
  className?: string;
}

export function SilkMesh({
  colorA,
  colorB,
  speed = 0.6,
  count = 4,
  swirl = 0.5,
  smoothness = 0.6,
  grain = 0.06,
  className,
}: SilkMeshProps) {
  const reduce = useReducedMotion();
  const theme = useTheme();
  const classes = cn("absolute inset-0 h-full w-full", className);
  if (!theme) return <div className={classes} />;
  return (
    <Shader className={classes}>
      <MeshGradient
        colorA={colorA ?? theme.background}
        colorB={colorB ?? theme.primary}
        colorSpace="oklab"
        speed={reduce ? 0 : speed}
        count={count}
        swirl={swirl}
        smoothness={smoothness}
      />
      <SimplexNoise
        colorA="hsl(0 0% 0%)"
        colorB="hsl(0 0% 100%)"
        scale={3}
        speed={reduce ? 0 : 0.5}
        opacity={0.12}
        blendMode="softLight"
      />
      <FilmGrain strength={grain} animated={!reduce} />
    </Shader>
  );
}
