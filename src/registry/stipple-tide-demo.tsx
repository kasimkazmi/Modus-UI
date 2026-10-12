"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { StippleTide } from "./stipple-tide";

export default function StippleTideDemo(props: Partial<ComponentProps<typeof StippleTide>>) {
  return (
    <ModusStage caption="Stipple Tide" layout="bleed">
      <StippleTide {...props} />
    </ModusStage>
  );
}
