"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { RisingMotes } from "./rising-motes";

export default function RisingMotesDemo(props: Partial<ComponentProps<typeof RisingMotes>>) {
  return (
    <ModusStage caption="Rising Motes" layout="center">
      <RisingMotes {...props} />
    </ModusStage>
  );
}
