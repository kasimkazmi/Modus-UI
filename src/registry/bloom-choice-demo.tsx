"use client";

import { ModusStage } from "@/components/modus-stage";
import { BloomChoice } from "./bloom-choice";

export default function BloomChoiceDemo() {
  return (
    <ModusStage caption="Bloom Choice" layout="center">
      <BloomChoice defaultValue="Proof" />
    </ModusStage>
  );
}
