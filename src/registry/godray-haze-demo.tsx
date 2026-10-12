"use client";

import type { ComponentProps } from "react";
import { GodrayHaze } from "./godray-haze";

export default function GodrayHazeDemo(props: Partial<ComponentProps<typeof GodrayHaze>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <GodrayHaze {...props} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs font-medium uppercase tracking-widest text-white/70">
        Godray Haze
      </p>
    </div>
  );
}
