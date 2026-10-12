"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { InkRush } from "./ink-rush";

export default function InkRushDemo(props: Partial<ComponentProps<typeof InkRush>>) {
  return (
    <ModusStage caption="Ink Rush" layout="bleed">
      <InkRush {...props} />
    </ModusStage>
  );
}
