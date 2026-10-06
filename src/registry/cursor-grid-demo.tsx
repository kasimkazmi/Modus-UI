"use client";

import { CursorGrid } from "./cursor-grid";

export default function CursorGridDemo() {
  return (
    <div className="relative flex h-[500px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-black">
      <CursorGrid
        color="#3b82f6"
        cellSize={25}
        radius={150}
        falloff="gaussian"
        fadeDuration={800}
        clickPulse={true}
        className="h-full w-full"
      />
      <div className="pointer-events-none absolute text-xl font-medium uppercase tracking-widest text-white/50">
        Hover over the grid
      </div>
    </div>
  );
}
