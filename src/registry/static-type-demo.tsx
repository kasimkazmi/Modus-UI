"use client";

import { ModusStage } from "@/components/modus-stage";
import { StaticType } from "./static-type";

export default function StaticTypeDemo() {
  return (
    <ModusStage caption="Static Type" layout="center">
      <StaticType hoverIntensity={0.5}>Modus</StaticType>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
