"use client";

import { ModusStage } from "@/components/modus-stage";
import { RouseTrack } from "./rouse-track";

export default function RouseTrackDemo() {
  return (
    <ModusStage caption="Rouse Track" layout="center">
      <div className="w-full max-w-md">
        <RouseTrack ariaLabel="Leading" />
      </div>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
