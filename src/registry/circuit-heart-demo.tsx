"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { CircuitHeart } from "./circuit-heart";

export default function CircuitHeartDemo(props: Partial<ComponentProps<typeof CircuitHeart>>) {
  return (
    <ModusStage caption="Circuit Heart" layout="bleed">
      <CircuitHeart {...props} />
    </ModusStage>
  );
}
