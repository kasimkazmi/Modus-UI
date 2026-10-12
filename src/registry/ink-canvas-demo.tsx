"use client";

import type { ComponentProps } from "react";
import { InkCanvas } from "./ink-canvas";

export default function InkCanvasDemo(props: Partial<ComponentProps<typeof InkCanvas>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <InkCanvas {...props} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs font-medium uppercase tracking-widest text-white/70">
        Drag to paint
      </p>
    </div>
  );
}
