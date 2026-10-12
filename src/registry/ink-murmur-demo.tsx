"use client";

import { ModusStage } from "@/components/modus-stage";
import { InkMurmur } from "./ink-murmur";

export default function InkMurmurDemo() {
  return (
    <ModusStage caption="Ink Murmur" layout="center">
      <InkMurmur
        className="text-foreground"
        steps={["Reading the brief", "Setting the measure", "Pulling a proof"]}
      />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
