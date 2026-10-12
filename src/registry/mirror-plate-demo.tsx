"use client";

import { ModusStage } from "@/components/modus-stage";
import { MirrorPlate } from "./mirror-plate";

export default function MirrorPlateDemo() {
  return (
    <ModusStage caption="Mirror Plate" layout="center">
      <MirrorPlate />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
