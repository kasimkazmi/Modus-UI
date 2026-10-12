"use client";

import type { ComponentProps } from "react";
import { ParticleDrift } from "./particle-drift";

export default function ParticleDriftDemo(props: Partial<ComponentProps<typeof ParticleDrift>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <ParticleDrift {...props} />
    </div>
  );
}
