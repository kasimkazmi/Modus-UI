"use client";

import type { ComponentProps } from "react";
import { FluxVortex } from "./flux-vortex";

export default function FluxVortexDemo(props: Partial<ComponentProps<typeof FluxVortex>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <FluxVortex {...props} />
    </div>
  );
}
