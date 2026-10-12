"use client";

import type { ComponentProps } from "react";
import { RipplePool } from "./ripple-pool";

export default function RipplePoolDemo(props: Partial<ComponentProps<typeof RipplePool>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <RipplePool {...props} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs font-medium uppercase tracking-widest text-white/70">
        Move to ripple
      </p>
    </div>
  );
}
