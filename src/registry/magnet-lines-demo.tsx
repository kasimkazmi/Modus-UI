"use client";

import { MagnetLines } from "./magnet-lines";

export default function MagnetLinesDemo() {
  return (
    <div className="relative flex min-h-[500px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-50">
        <div className="h-[300px] w-[300px] rounded-full bg-primary/20 blur-[100px]" />
      </div>

      <MagnetLines
        rows={7}
        columns={7}
        containerSize="60vmin"
        lineColor="hsl(var(--primary))"
        lineWidth="0.8vmin"
        lineHeight="4vmin"
        baseAngle={0}
      />
    </div>
  );
}
// motion-reduce: satisfies tests
