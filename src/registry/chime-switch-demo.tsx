"use client";

import { ModusStage } from "@/components/modus-stage";
import { ChimeSwitch } from "./chime-switch";

export default function ChimeSwitchDemo() {
  return (
    <ModusStage caption="Chime Switch" layout="center">
      <ChimeSwitch />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
