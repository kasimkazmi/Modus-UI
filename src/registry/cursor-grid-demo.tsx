"use client";

import { CursorGrid } from "./cursor-grid";

export default function CursorGridDemo() {
  return (
    <div className="relative flex w-full items-center justify-center h-[500px] overflow-hidden rounded-xl border border-border bg-black">
      <CursorGrid
        color="#3b82f6"
        cellSize={25}
        radius={150}
        falloff="gaussian"
        fadeDuration={800}
        clickPulse={true}
        className="w-full h-full"
      />
      <div className="absolute pointer-events-none text-white/50 text-xl font-medium tracking-widest uppercase">
        Hover over the grid
      </div>
    </div>
  );
}
