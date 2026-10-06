"use client";

import { useEffect, useRef, useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BlobCursorProps {
  blobType?: "circle" | "square" | "almond";
  fillColor?: string;
  className?: string;
}

export function BlobCursor({
  blobType = "circle",
  fillColor = "hsl(var(--primary))",
  className,
}: BlobCursorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobsRef = useRef<(HTMLDivElement | null)[]>([]);
  // Reduced motion: no trailing lerp loop; the blobs jump straight to the pointer.
  const prefersReducedMotion = useReducedMotion();

  // Smooth trailing configuration
  const trailCount = 8;
  const positions = useRef<{ x: number; y: number }[]>(Array(trailCount).fill({ x: 0, y: 0 }));
  const mousePos = useRef({ x: 0, y: 0 });

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      let clientX, clientY;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      mousePos.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };

      if (prefersReducedMotion) {
        const { x, y } = mousePos.current;
        blobsRef.current.forEach((blob) => {
          if (blob) blob.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        });
      }
    },
    [prefersReducedMotion],
  );

  useEffect(() => {
    if (prefersReducedMotion) return;
    let animationFrameId: number;

    const render = () => {
      // Lerp logic for trail
      for (let i = 0; i < trailCount; i++) {
        const target = i === 0 ? mousePos.current : positions.current[i - 1];

        // Easing depends on the blob position in the trail
        const ease = i === 0 ? 0.3 : 0.4;

        positions.current[i] = {
          x: positions.current[i].x + (target.x - positions.current[i].x) * ease,
          y: positions.current[i].y + (target.y - positions.current[i].y) * ease,
        };

        if (blobsRef.current[i]) {
          blobsRef.current[i]!.style.transform =
            `translate(${positions.current[i].x}px, ${positions.current[i].y}px) translate(-50%, -50%)`;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      className={cn("absolute inset-0 h-full w-full overflow-hidden", className)}
      style={{ zIndex: 50 }}
    >
      {/* SVG Filter for Blob gooey effect */}
      <svg className="absolute h-0 w-0">
        <filter id="gooey-filter">
          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>

      <div
        className="pointer-events-none absolute inset-0 cursor-crosshair select-none overflow-hidden"
        style={{ filter: "url(#gooey-filter)" }}
      >
        {Array.from({ length: trailCount }).map((_, i) => {
          // Calculate fading sizes and opacities
          const size = 50 - i * 4;
          const opacity = 1 - i * 0.1;

          return (
            <div
              key={i}
              ref={(el) => {
                blobsRef.current[i] = el;
              }}
              className="absolute left-0 top-0 will-change-transform"
              style={{
                width: size,
                height: size,
                borderRadius: blobType === "circle" ? "50%" : "20%",
                backgroundColor: fillColor,
                opacity: opacity,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
