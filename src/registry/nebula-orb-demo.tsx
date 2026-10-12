"use client";

import type { ComponentProps } from "react";
import { NebulaOrb } from "./nebula-orb";

export default function NebulaOrbDemo(props: Partial<ComponentProps<typeof NebulaOrb>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <NebulaOrb {...props} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs font-medium uppercase tracking-widest text-white/70">
        Nebula Orb
      </p>
    </div>
  );
}
