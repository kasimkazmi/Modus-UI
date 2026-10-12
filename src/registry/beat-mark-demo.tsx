"use client";

import { ModusStage } from "@/components/modus-stage";
import { BeatMark } from "./beat-mark";

export default function BeatMarkDemo() {
  return (
    <ModusStage caption="Beat Mark" layout="center">
      <BeatMark />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
