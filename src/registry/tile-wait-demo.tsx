"use client";

import { ModusStage } from "@/components/modus-stage";
import { TileWait } from "./tile-wait";

export default function TileWaitDemo() {
  return (
    <ModusStage caption="Tile Wait" layout="center">
      <TileWait className="text-foreground" />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
