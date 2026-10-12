"use client";

import type { ComponentProps } from "react";
import { DataPixelArc } from "./data-pixel-arc";

export default function DataPixelArcDemo(props: Partial<ComponentProps<typeof DataPixelArc>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <DataPixelArc {...props} />
    </div>
  );
}
