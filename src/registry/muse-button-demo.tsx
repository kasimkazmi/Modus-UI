"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { MuseButton } from "./muse-button";

export default function MuseButtonDemo(props: Partial<ComponentProps<typeof MuseButton>>) {
  return (
    <ModusStage caption="Muse Button" layout="bleed">
      <MuseButton {...props} />
    </ModusStage>
  );
}
