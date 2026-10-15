"use client";
// Canvas grid of characters that keep scrambling and shifting colour.

import * as React from "react";
import { useAnimationFrame, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LetterGlitchProps extends React.HTMLAttributes<HTMLDivElement> {
  glitchColors?: string[];
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  lightMode?: boolean;
  backgroundColor?: string;
  characters?: string;
}

const CELL_W = 10;
const CELL_H = 20;
const SHARE = 0.05;

type RGB = [number, number, number];

interface Cell {
  char: string;
  color: RGB;
  target: RGB;
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export function LetterGlitch({
  glitchColors = ["hsl(var(--primary))", "hsl(var(--primary))", "hsl(var(--primary))"],
  glitchSpeed = 50,
  centerVignette = true,
  outerVignette = true,
  smooth = true,
  lightMode = false,
  backgroundColor,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789",
  className,
  ...props
}: LetterGlitchProps) {
  const reduceMotion = useReducedMotion();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const cells = React.useRef<Cell[]>([]);
  const cols = React.useRef(0);
  const palette = React.useRef<RGB[]>([[255, 255, 255]]);
  const lastGlitch = React.useRef(0);
  const glyphs = React.useMemo(() => Array.from(characters), [characters]);
  const shade = lightMode ? "255,255,255" : "0,0,0";
  const colorKey = glitchColors.join("|");

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${CELL_H * 0.8}px ui-monospace, monospace`;
    ctx.textBaseline = "top";
    cells.current.forEach((cell, i) => {
      ctx.fillStyle = `rgb(${cell.color.map(Math.round).join(",")})`;
      ctx.fillText(cell.char, (i % cols.current) * CELL_W, Math.floor(i / cols.current) * CELL_H);
    });
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const probe = document.createElement("span");
    canvas.parentElement!.appendChild(probe);
    palette.current = glitchColors.map((c) => {
      probe.style.color = c;
      return getComputedStyle(probe)
        .color.match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number) as RGB;
    });
    probe.remove();

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols.current = Math.ceil(width / CELL_W);
      cells.current = Array.from({ length: cols.current * Math.ceil(height / CELL_H) }, () => {
        const color = pick(palette.current);
        return { char: pick(glyphs), color: [...color], target: color };
      });
      draw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorKey, glyphs, draw]);

  useAnimationFrame((time) => {
    if (reduceMotion) return;
    if (time - lastGlitch.current >= glitchSpeed) {
      lastGlitch.current = time;
      const count = Math.max(1, Math.floor(cells.current.length * SHARE));
      for (let n = 0; n < count; n++) {
        const cell = pick(cells.current);
        if (!cell) break;
        cell.char = pick(glyphs);
        cell.target = pick(palette.current);
        if (!smooth) cell.color = [...cell.target];
      }
    }
    if (smooth) {
      for (const cell of cells.current) {
        for (let k = 0; k < 3; k++) cell.color[k] += (cell.target[k] - cell.color[k]) * 0.08;
      }
    }
    draw();
  });

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)} {...props}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ backgroundColor: backgroundColor ?? (lightMode ? "#ffffff" : "#000000") }}
      />
      {outerVignette && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle, rgba(${shade},0) 55%, rgba(${shade},1) 100%)`,
          }}
        />
      )}
      {centerVignette && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle, rgba(${shade},0.75) 0%, rgba(${shade},0) 60%)`,
          }}
        />
      )}
    </div>
  );
}
