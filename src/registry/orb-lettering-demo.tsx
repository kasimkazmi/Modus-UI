"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { OrbLettering } from "./orb-lettering";

export default function OrbLetteringDemo(props: Partial<ComponentProps<typeof OrbLettering>>) {
  return (
    <ModusStage caption="Orb Lettering" layout="bleed">
      <OrbLettering {...props} />
    </ModusStage>
  );
}
