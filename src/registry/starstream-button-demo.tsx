"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { StarstreamButton } from "./starstream-button";

export default function StarstreamButtonDemo(
  props: Partial<ComponentProps<typeof StarstreamButton>>,
) {
  return (
    <ModusStage caption="Starstream Button" layout="bleed">
      <StarstreamButton {...props} />
    </ModusStage>
  );
}
