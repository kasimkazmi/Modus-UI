"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MagnetLinesProps {
  rows?: number;
  columns?: number;
  containerSize?: string;
  lineColor?: string;
  lineWidth?: string;
  lineHeight?: string;
  baseAngle?: number;
  className?: string;
}

export function MagnetLines({
  rows = 9,
  columns = 9,
  containerSize = "80vmin",
  lineColor = "currentColor",
  lineWidth = "1vmin",
  lineHeight = "6vmin",
  baseAngle = -10,
  className,
}: MagnetLinesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll("span");

    const onPointerMove = (pointer: { x: number; y: number }) => {
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;

        const b = pointer.x - centerX;
        const a = pointer.y - centerY;
        const c = Math.sqrt(a * a + b * b) || 1;
        const r = ((Math.acos(b / c) * 180) / Math.PI) * (pointer.y > centerY ? 1 : -1);

        item.style.setProperty("--rotate", `${r}deg`);
      });
    };

    const handlePointerMove = (e: PointerEvent) => {
      onPointerMove({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("pointermove", handlePointerMove);

    if (items.length) {
      const middleIndex = Math.floor(items.length / 2);
      const rect = items[middleIndex].getBoundingClientRect();
      onPointerMove({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [rows, columns]);

  const total = rows * columns;
  const spans = Array.from({ length: total }, (_, i) => (
    <span
      key={i}
      className="block origin-center rounded-full will-change-transform"
      style={
        {
          backgroundColor: lineColor,
          width: lineWidth,
          height: lineHeight,
          "--rotate": `${baseAngle}deg`,
          transform: "rotate(var(--rotate))",
        } as React.CSSProperties
      }
    />
  ));

  return (
    <div
      ref={containerRef}
      className={cn("z-10 grid place-items-center", className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        width: containerSize,
        height: containerSize,
      }}
    >
      {spans}
    </div>
  );
}
