"use client";

import type { ComponentProps } from "react";
import { StructureFlow } from "./structure-flow";

export default function StructureFlowDemo(props: Partial<ComponentProps<typeof StructureFlow>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <StructureFlow {...props} />
    </div>
  );
}
