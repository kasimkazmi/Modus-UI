"use client";

import type { ComponentProps } from "react";
import { OrbitalSphere } from "./orbital-sphere";

export default function OrbitalSphereDemo(props: Partial<ComponentProps<typeof OrbitalSphere>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <OrbitalSphere {...props} />
    </div>
  );
}
