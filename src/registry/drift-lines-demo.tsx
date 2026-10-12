"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { DriftLines } from "./drift-lines";

export default function DriftLinesDemo(props: Partial<ComponentProps<typeof DriftLines>>) {
  return (
    <ModusStage caption="Drift Lines" layout="bleed">
      <DriftLines {...props} />
    </ModusStage>
  );
}
