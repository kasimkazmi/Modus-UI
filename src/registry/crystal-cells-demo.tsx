"use client";

import type { ComponentProps } from "react";
import { CrystalCells } from "./crystal-cells";

export default function CrystalCellsDemo(props: Partial<ComponentProps<typeof CrystalCells>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <CrystalCells {...props} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs font-medium uppercase tracking-widest text-white/70">
        Crystal Cells
      </p>
    </div>
  );
}
