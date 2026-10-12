"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { RollLabel } from "./roll-label";

export default function RollLabelDemo(props: Partial<ComponentProps<typeof RollLabel>>) {
  return (
    <ModusStage caption="Roll Label" layout="center">
      <RollLabel {...props} />
    </ModusStage>
  );
}
