"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { CometRingButton } from "./comet-ring-button";

export default function CometRingButtonDemo(
  props: Partial<ComponentProps<typeof CometRingButton>>,
) {
  return (
    <ModusStage caption="Comet Ring Button" layout="center">
      <CometRingButton {...props} />
    </ModusStage>
  );
}
