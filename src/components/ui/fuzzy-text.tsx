"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface FuzzyTextProps {
  children: React.ReactNode;
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  hoverHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  className?: string;
}

export function FuzzyText({
  children,
  fontSize = "clamp(3rem, 8vw, 6rem)",
  fontWeight = 900,
  fontFamily = "inherit",
  color = "var(--foreground)",
  hoverHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.6,
  className,
}: FuzzyTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let isHovering = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw base text
      ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillStyle = color;

      // We manually handle centering based on canvas dimensions
      const text = String(children);
      const metrics = ctx.measureText(text);

      // Adjust canvas size based on text if not set
      if (canvas.width === 0 || canvas.height === 0) {
        // High DPI setup
        const dpr = window.devicePixelRatio || 1;
        canvas.width = (metrics.width + 100) * dpr;
        canvas.height = 200 * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${metrics.width + 100}px`;
        canvas.style.height = `200px`;
      }

      const drawX = canvas.width / (2 * (window.devicePixelRatio || 1));
      const drawY = canvas.height / (2 * (window.devicePixelRatio || 1));

      ctx.fillText(text, drawX, drawY);

      // Apply fuzzy displacement
      const intensity = isHovering ? hoverIntensity : baseIntensity;
      if (intensity > 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const newImageData = ctx.createImageData(canvas.width, canvas.height);
        const newPixels = newImageData.data;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;

            // If pixel is not transparent
            if (pixels[index + 3] > 0) {
              // Displacement logic
              const offsetX = (Math.random() - 0.5) * intensity * 20;
              const offsetY = (Math.random() - 0.5) * intensity * 20;

              const srcX = Math.min(Math.max(Math.floor(x + offsetX), 0), canvas.width - 1);
              const srcY = Math.min(Math.max(Math.floor(y + offsetY), 0), canvas.height - 1);

              const srcIndex = (srcY * canvas.width + srcX) * 4;

              newPixels[index] = pixels[srcIndex];
              newPixels[index + 1] = pixels[srcIndex + 1];
              newPixels[index + 2] = pixels[srcIndex + 2];
              newPixels[index + 3] = pixels[srcIndex + 3];
            }
          }
        }
        ctx.putImageData(newImageData, 0, 0);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleMouseEnter = () => {
      if (hoverHover) isHovering = true;
    };
    const handleMouseLeave = () => {
      if (hoverHover) isHovering = false;
    };

    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [
    children,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    hoverHover,
    baseIntensity,
    hoverIntensity,
  ]);

  return <canvas ref={canvasRef} className={cn("block max-w-full cursor-default", className)} />;
}
