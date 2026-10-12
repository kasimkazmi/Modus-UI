"use client";

import type { ComponentProps } from "react";
import { PlasmaGlow } from "./plasma-glow";

export default function PlasmaGlowDemo(props: Partial<ComponentProps<typeof PlasmaGlow>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <PlasmaGlow {...props} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs font-medium uppercase tracking-widest text-white/70">
        Plasma Glow
      </p>
    </div>
  );
}
