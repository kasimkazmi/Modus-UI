"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { ReliefMesh } from "./relief-mesh";

export default function ReliefMeshDemo(props: Partial<ComponentProps<typeof ReliefMesh>>) {
  return (
    <ModusStage caption="Relief Mesh" layout="bleed">
      <ReliefMesh {...props} />
    </ModusStage>
  );
}
