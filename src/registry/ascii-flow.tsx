"use client";
// Built on the shaders library (MIT, © 2026 Shader Effects Inc.).

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Ascii, FractalNoise, Shader } from "shaders/react";
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

export interface AsciiFlowProps {
  colorA?: string;
  colorB?: string;
  characters?: string;
  cellSize?: number;
  speed?: number;
  contrast?: number;
  className?: string;
}

export function AsciiFlow({
  colorA,
  colorB,
  characters = " .:-=+*#%@",
  cellSize = 16,
  speed = 0.4,
  contrast = 1.2,
  className,
}: AsciiFlowProps) {
  const reduce = useReducedMotion();
  const theme = useTheme();
  const classes = cn("absolute inset-0 h-full w-full", className);
  if (!theme) return <div className={classes} />;
  return (
    <Shader className={classes}>
      <FractalNoise
        colorA={colorA ?? theme.background}
        colorB={colorB ?? theme.primary}
        colorSpace="oklab"
        speed={reduce ? 0 : speed}
        contrast={contrast}
      />
      <Ascii characters={characters} cellSize={cellSize} />
    </Shader>
  );
}
