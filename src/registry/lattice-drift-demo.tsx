"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { LatticeDrift } from "./lattice-drift";

export default function LatticeDriftDemo(props: Partial<ComponentProps<typeof LatticeDrift>>) {
  return (
    <ModusStage caption="Lattice Drift" layout="bleed">
      <LatticeDrift {...props} />
    </ModusStage>
  );
}
