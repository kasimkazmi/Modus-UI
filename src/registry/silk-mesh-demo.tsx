"use client";

import type { ComponentProps } from "react";
import { SilkMesh } from "./silk-mesh";

export default function SilkMeshDemo(props: Partial<ComponentProps<typeof SilkMesh>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <SilkMesh {...props} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs font-medium uppercase tracking-widest text-white/70">
        Silk Mesh
      </p>
    </div>
  );
}
