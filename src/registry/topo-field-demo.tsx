"use client";

import type { ComponentProps } from "react";
import { TopoField } from "./topo-field";

export default function TopoFieldDemo(props: Partial<ComponentProps<typeof TopoField>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <TopoField {...props} />
    </div>
  );
}
