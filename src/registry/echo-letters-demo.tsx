"use client";

import { ModusStage } from "@/components/modus-stage";
import { EchoLetters } from "./echo-letters";

export default function EchoLettersDemo() {
  return (
    <ModusStage caption="Echo Letters" layout="bleed">
      <div className="absolute inset-0">
        <EchoLetters />
      </div>
    </ModusStage>
  );
}
