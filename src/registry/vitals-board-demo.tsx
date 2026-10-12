"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { VitalsBoard } from "./vitals-board";

export default function VitalsBoardDemo(props: Partial<ComponentProps<typeof VitalsBoard>>) {
  return (
    <ModusStage caption="Vitals Board" layout="center">
      <VitalsBoard {...props} />
    </ModusStage>
  );
}
