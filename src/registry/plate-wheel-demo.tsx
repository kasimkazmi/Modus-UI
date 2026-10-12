"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { PlateWheel } from "./plate-wheel";

export default function PlateWheelDemo(props: Partial<ComponentProps<typeof PlateWheel>>) {
  return (
    <ModusStage caption="Plate Wheel" layout="bleed">
      <PlateWheel {...props} />
    </ModusStage>
  );
}
