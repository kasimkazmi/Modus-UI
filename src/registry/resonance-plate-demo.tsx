"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { ResonancePlate } from "./resonance-plate";

export default function ResonancePlateDemo(props: Partial<ComponentProps<typeof ResonancePlate>>) {
  return (
    <ModusStage caption="Resonance Plate" layout="bleed">
      <ResonancePlate {...props} />
    </ModusStage>
  );
}
