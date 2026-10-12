"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { SatinCapsule } from "./satin-capsule";

export default function SatinCapsuleDemo(props: Partial<ComponentProps<typeof SatinCapsule>>) {
  return (
    <ModusStage caption="Satin Capsule" layout="center">
      <SatinCapsule {...props} />
    </ModusStage>
  );
}
