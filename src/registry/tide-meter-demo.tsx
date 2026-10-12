"use client";

import { ModusStage } from "@/components/modus-stage";
import { TideMeter } from "./tide-meter";

export default function TideMeterDemo() {
  return (
    <ModusStage caption="Tide Meter" layout="center">
      <div className="flex items-end gap-6">
        <TideMeter />
        <TideMeter defaultValue={28} width={56} height={150} ariaLabel="Ink" />
      </div>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
