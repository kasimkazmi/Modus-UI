"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { StitchFrameButton } from "./stitch-frame-button";

export default function StitchFrameButtonDemo(
  props: Partial<ComponentProps<typeof StitchFrameButton>>,
) {
  return (
    <ModusStage caption="Stitch Frame Button" layout="center">
      <StitchFrameButton {...props} />
    </ModusStage>
  );
}
