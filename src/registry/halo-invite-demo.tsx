"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { HaloInvite } from "./halo-invite";

export default function HaloInviteDemo(props: Partial<ComponentProps<typeof HaloInvite>>) {
  return (
    <ModusStage caption="Halo Invite" layout="center">
      <HaloInvite {...props} />
    </ModusStage>
  );
}
