"use client";

import { ModusStage } from "@/components/modus-stage";
import { OrbitKnob } from "./orbit-knob";

export default function OrbitKnobDemo() {
  return (
    <ModusStage caption="Orbit Knob" layout="center">
      <OrbitKnob />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
