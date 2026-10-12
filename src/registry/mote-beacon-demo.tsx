"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { MoteBeacon } from "./mote-beacon";

export default function MoteBeaconDemo(props: Partial<ComponentProps<typeof MoteBeacon>>) {
  return (
    <ModusStage caption="Mote Beacon" layout="bleed">
      <MoteBeacon {...props} />
    </ModusStage>
  );
}
