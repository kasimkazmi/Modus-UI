"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { RibbonLight } from "./ribbon-light";

export default function RibbonLightDemo(props: Partial<ComponentProps<typeof RibbonLight>>) {
  return (
    <ModusStage caption="Ribbon Light" layout="bleed">
      <RibbonLight {...props} />
    </ModusStage>
  );
}
