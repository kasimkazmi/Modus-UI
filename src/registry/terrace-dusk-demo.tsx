"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { TerraceDusk } from "./terrace-dusk";

export default function TerraceDuskDemo(props: Partial<ComponentProps<typeof TerraceDusk>>) {
  return (
    <ModusStage caption="Terrace Dusk" layout="bleed">
      <TerraceDusk {...props} />
    </ModusStage>
  );
}
