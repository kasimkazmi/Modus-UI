"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { SilkBands } from "./silk-bands";

export default function SilkBandsDemo(props: Partial<ComponentProps<typeof SilkBands>>) {
  return (
    <ModusStage caption="Silk Bands" layout="bleed">
      <SilkBands {...props} />
    </ModusStage>
  );
}
