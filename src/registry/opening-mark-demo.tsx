"use client";

import { ModusStage } from "@/components/modus-stage";
import { OpeningMark } from "./opening-mark";

export default function OpeningMarkDemo() {
  return (
    <ModusStage caption="Opening Mark" layout="bleed">
      <div className="absolute inset-0">
        <OpeningMark />
      </div>
    </ModusStage>
  );
}
