"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { NodeWeave } from "./node-weave";

export default function NodeWeaveDemo(props: Partial<ComponentProps<typeof NodeWeave>>) {
  return (
    <ModusStage caption="Node Weave" layout="bleed">
      <NodeWeave {...props} />
    </ModusStage>
  );
}
