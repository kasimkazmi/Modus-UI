"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { LightCut } from "./light-cut";

export default function LightCutDemo(props: Partial<ComponentProps<typeof LightCut>>) {
  return (
    <ModusStage caption="Light Cut" layout="bleed">
      <LightCut {...props} />
    </ModusStage>
  );
}
