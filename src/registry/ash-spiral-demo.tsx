"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { AshSpiral } from "./ash-spiral";

export default function AshSpiralDemo(props: Partial<ComponentProps<typeof AshSpiral>>) {
  return (
    <ModusStage caption="Ash Spiral" layout="bleed">
      <AshSpiral {...props} />
    </ModusStage>
  );
}
