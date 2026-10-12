"use client";

import { ModusStage } from "@/components/modus-stage";
import { HumCapsule } from "./hum-capsule";

export default function HumCapsuleDemo() {
  return (
    <ModusStage caption="Hum Capsule" layout="center">
      <HumCapsule size={40} />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
