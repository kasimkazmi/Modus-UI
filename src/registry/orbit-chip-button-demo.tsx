"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { OrbitChipButton } from "@/registry/orbit-chip-button";

export default function OrbitChipButtonDemo(
  props: Partial<ComponentProps<typeof OrbitChipButton>>,
) {
  return (
    <ModusStage caption="Orbit Chip Button" layout="center">
      <OrbitChipButton {...props} />
    </ModusStage>
  );
}
