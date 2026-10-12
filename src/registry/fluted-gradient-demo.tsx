"use client";

import type { ComponentProps } from "react";
import { FlutedGradient } from "./fluted-gradient";

export default function FlutedGradientDemo(props: Partial<ComponentProps<typeof FlutedGradient>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <FlutedGradient {...props} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs font-medium uppercase tracking-widest text-white/70">
        Fluted Glass
      </p>
    </div>
  );
}
