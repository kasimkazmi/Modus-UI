"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { ArcHaloButton } from "./arc-halo-button";

export default function ArcHaloButtonDemo(props: Partial<ComponentProps<typeof ArcHaloButton>>) {
  return (
    <ModusStage caption="Arc Halo Button" layout="bleed">
      <ArcHaloButton {...props} />
    </ModusStage>
  );
}
