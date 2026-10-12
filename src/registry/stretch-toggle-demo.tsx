"use client";

import { ModusStage } from "@/components/modus-stage";
import { StretchToggle } from "./stretch-toggle";

export default function StretchToggleDemo() {
  return (
    <ModusStage caption="Stretch Toggle" layout="center">
      <StretchToggle items={["Draft", "Review", "Publish"]} />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
