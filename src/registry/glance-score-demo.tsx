"use client";

import { ModusStage } from "@/components/modus-stage";
import { GlanceScore } from "./glance-score";

export default function GlanceScoreDemo() {
  return (
    <ModusStage caption="Glance Score" layout="center">
      <GlanceScore defaultValue={3} labels={["Poor", "Fair", "Good", "Great", "Superb"]} />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
