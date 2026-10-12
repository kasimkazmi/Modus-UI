"use client";

import type { ComponentProps } from "react";
import { OverrideGrid } from "./override-grid";

export default function OverrideGridDemo(props: Partial<ComponentProps<typeof OverrideGrid>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <OverrideGrid {...props} />
    </div>
  );
}
