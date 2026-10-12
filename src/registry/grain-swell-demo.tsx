"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { GrainSwell } from "./grain-swell";

export default function GrainSwellDemo(props: Partial<ComponentProps<typeof GrainSwell>>) {
  return (
    <ModusStage caption="Grain Swell" layout="bleed">
      <GrainSwell {...props} />
    </ModusStage>
  );
}
