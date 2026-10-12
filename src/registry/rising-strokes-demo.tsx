"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { RisingStrokes } from "./rising-strokes";

export default function RisingStrokesDemo(props: Partial<ComponentProps<typeof RisingStrokes>>) {
  return (
    <ModusStage caption="Rising Strokes" layout="bleed">
      <RisingStrokes {...props} />
    </ModusStage>
  );
}
