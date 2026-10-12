"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { PhosphorTube } from "./phosphor-tube";

export default function PhosphorTubeDemo(props: Partial<ComponentProps<typeof PhosphorTube>>) {
  return (
    <ModusStage caption="Phosphor Tube" layout="bleed">
      <PhosphorTube className="absolute inset-0" {...props} />
    </ModusStage>
  );
}
