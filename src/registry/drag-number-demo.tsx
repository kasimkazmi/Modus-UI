"use client";

import { ModusStage } from "@/components/modus-stage";
import { DragNumber } from "./drag-number";

export default function DragNumberDemo() {
  return (
    <ModusStage caption="Drag Number" layout="center">
      <div className="flex flex-col items-start gap-3">
        <DragNumber />
        <DragNumber label="Leading" suffix="%" defaultValue={140} min={80} max={200} />
        <DragNumber
          label="Tracking"
          suffix="em"
          defaultValue={0.02}
          min={-0.1}
          max={0.3}
          step={0.01}
        />
      </div>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
