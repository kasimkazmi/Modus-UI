"use client";

import type { ComponentProps } from "react";
import { AuroraVeil } from "./aurora-veil";

export default function AuroraVeilDemo(props: Partial<ComponentProps<typeof AuroraVeil>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <AuroraVeil {...props} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs font-medium uppercase tracking-widest text-white/70">
        Aurora Veil
      </p>
    </div>
  );
}
