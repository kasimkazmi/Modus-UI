"use client";

import type { ComponentProps } from "react";
import { EnergyOrb } from "./energy-orb";

export default function EnergyOrbDemo(props: Partial<ComponentProps<typeof EnergyOrb>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border bg-black">
      <EnergyOrb {...props} />
    </div>
  );
}
