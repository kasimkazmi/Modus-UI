"use client";

import type { ComponentProps } from "react";
import { DotMatrix } from "./dot-matrix";

export default function DotMatrixDemo(props: Partial<ComponentProps<typeof DotMatrix>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <DotMatrix {...props} />
    </div>
  );
}
