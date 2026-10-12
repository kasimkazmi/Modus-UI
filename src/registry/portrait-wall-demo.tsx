"use client";

import { ModusStage } from "@/components/modus-stage";
import { PortraitWall } from "./portrait-wall";

export default function PortraitWallDemo() {
  return (
    <ModusStage caption="Portrait Wall" layout="center">
      <PortraitWall />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
