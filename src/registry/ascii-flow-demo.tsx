"use client";

import type { ComponentProps } from "react";
import { AsciiFlow } from "./ascii-flow";

export default function AsciiFlowDemo(props: Partial<ComponentProps<typeof AsciiFlow>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <AsciiFlow {...props} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs font-medium uppercase tracking-widest text-white/70">
        ASCII Flow
      </p>
    </div>
  );
}
