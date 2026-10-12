"use client";

import { ModusStage } from "@/components/modus-stage";
import { PressToggle } from "./press-toggle";

export default function PressToggleDemo() {
  return (
    <ModusStage caption="Press Toggle" layout="center">
      <div className="flex flex-col items-start gap-4">
        <PressToggle />
        <PressToggle defaultChecked label="Show margins" />
      </div>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
