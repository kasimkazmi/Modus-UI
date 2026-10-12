"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { PulseDust } from "./pulse-dust";

export default function PulseDustDemo(props: Partial<ComponentProps<typeof PulseDust>>) {
  return (
    <ModusStage caption="Pulse Dust" layout="bleed">
      <PulseDust {...props} />
    </ModusStage>
  );
}
