"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { SignalTiles } from "./signal-tiles";

export default function SignalTilesDemo(props: Partial<ComponentProps<typeof SignalTiles>>) {
  return (
    <ModusStage caption="Signal Tiles" layout="bleed">
      <SignalTiles {...props} />
    </ModusStage>
  );
}
