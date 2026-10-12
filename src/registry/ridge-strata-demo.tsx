"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { RidgeStrata } from "./ridge-strata";

export default function RidgeStrataDemo(props: Partial<ComponentProps<typeof RidgeStrata>>) {
  return (
    <ModusStage caption="Ridge Strata" layout="bleed">
      <RidgeStrata {...props} />
    </ModusStage>
  );
}
