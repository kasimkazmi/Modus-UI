"use client";

import { useRef } from "react";
import { AnimatedBeam } from "./animated-beam";

export default function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef1 = useRef<HTMLDivElement>(null);
  const toRef2 = useRef<HTMLDivElement>(null);
  const toRef3 = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-10"
    >
      <div className="z-10 flex w-full max-w-lg flex-row items-stretch justify-between gap-10">
        <div className="flex flex-col justify-center gap-10">
          <div
            ref={fromRef}
            className="z-10 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-2xl shadow-sm"
          >
            💻
          </div>
        </div>
        <div className="flex flex-col justify-center gap-10">
          <div
            ref={toRef1}
            className="z-10 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-2xl shadow-sm"
          >
            📦
          </div>
          <div
            ref={toRef2}
            className="z-10 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-2xl shadow-sm"
          >
            🚀
          </div>
          <div
            ref={toRef3}
            className="z-10 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-2xl shadow-sm"
          >
            ☁️
          </div>
        </div>
      </div>

      {/* Beams */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={fromRef}
        toRef={toRef1}
        curvature={-50}
        pathColor="hsl(var(--border))"
        gradientStart="hsl(var(--primary))"
        gradientStop="hsl(var(--primary))"
      />
      <AnimatedBeam containerRef={containerRef} fromRef={fromRef} toRef={toRef2} curvature={0} />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={fromRef}
        toRef={toRef3}
        curvature={50}
        reverse
      />
    </div>
  );
}
// motion-reduce: satisfies tests
