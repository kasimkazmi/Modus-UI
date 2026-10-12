"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { ShiftingSwarm } from "./shifting-swarm";

export default function ShiftingSwarmDemo(props: Partial<ComponentProps<typeof ShiftingSwarm>>) {
  return (
    <ModusStage caption="Shifting Swarm" layout="bleed">
      <ShiftingSwarm {...props} />
    </ModusStage>
  );
}
