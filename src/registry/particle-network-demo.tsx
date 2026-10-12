"use client";

import type { ComponentProps } from "react";
import { ParticleNetwork } from "./particle-network";

export default function ParticleNetworkDemo(
  props: Partial<ComponentProps<typeof ParticleNetwork>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <ParticleNetwork {...props} />
    </div>
  );
}
