"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { StarTunnel } from "./star-tunnel";

export default function StarTunnelDemo(props: Partial<ComponentProps<typeof StarTunnel>>) {
  return (
    <ModusStage caption="Star Tunnel" layout="bleed">
      <StarTunnel {...props} />
    </ModusStage>
  );
}
