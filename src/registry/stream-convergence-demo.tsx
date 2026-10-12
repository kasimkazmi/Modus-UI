"use client";

import type { ComponentProps } from "react";
import { StreamConvergence } from "./stream-convergence";

export default function StreamConvergenceDemo(
  props: Partial<ComponentProps<typeof StreamConvergence>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border bg-black">
      <StreamConvergence {...props} />
    </div>
  );
}
