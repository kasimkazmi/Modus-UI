"use client";
// A grid of short strokes that swing to point at the cursor.
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface IronFilingsProps {
  rows?: number;
  columns?: number;
  containerSize?: string;
  lineColor?: string;
  lineWidth?: string;
  lineHeight?: string;
  baseAngle?: number;
  className?: string;
}

export function IronFilings({
  rows = 13,
  columns = 13,
  containerSize = "70vmin",
  lineColor = "hsl(var(--foreground))",
  lineWidth = "0.4vmin",
  lineHeight = "3.6vmin",
  baseAngle = 45,
  className,
}: IronFilingsProps) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    const aim = () => {
      frame = 0;
      if (!pointer || !root.current) return;
      for (const el of root.current.children as HTMLCollectionOf<HTMLElement>) {
        const r = el.getBoundingClientRect();
        const deg =
          (Math.atan2(pointer.y - (r.top + r.height / 2), pointer.x - (r.left + r.width / 2)) *
            180) /
            Math.PI +
          90;
        el.style.setProperty("--aim", `${deg}deg`);
      }
    };
    const onMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(aim);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden
      className={cn("grid place-items-center", className)}
      style={{
        width: containerSize,
        height: containerSize,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: rows * columns }, (_, i) => (
        <span
          key={i}
          className="block rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: lineWidth,
            height: lineHeight,
            background: i % 2 ? "hsl(var(--primary) / 0.55)" : lineColor,
            transform: `rotate(var(--aim, ${baseAngle}deg))`,
          }}
        />
      ))}
    </div>
  );
}
