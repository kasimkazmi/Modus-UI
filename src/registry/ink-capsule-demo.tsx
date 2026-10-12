"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { InkCapsule } from "./ink-capsule";

export default function InkCapsuleDemo(props: Partial<ComponentProps<typeof InkCapsule>>) {
  return (
    <ModusStage caption="Ink Capsule" layout="center">
      <InkCapsule {...props} />
    </ModusStage>
  );
}
