"use client";

import type { ComponentProps } from "react";
import { HalftoneFlow } from "./halftone-flow";

export default function HalftoneFlowDemo(props: Partial<ComponentProps<typeof HalftoneFlow>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <HalftoneFlow {...props} />
    </div>
  );
}
