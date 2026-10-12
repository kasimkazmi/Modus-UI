"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { TideLine } from "./tide-line";

export default function TideLineDemo(props: Partial<ComponentProps<typeof TideLine>>) {
  return (
    <ModusStage caption="Tide Line" layout="bleed">
      <TideLine {...props} />
    </ModusStage>
  );
}
