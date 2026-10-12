"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { DotScreen } from "./dot-screen";

export default function DotScreenDemo(props: Partial<ComponentProps<typeof DotScreen>>) {
  return (
    <ModusStage caption="Dot Screen" layout="bleed">
      <DotScreen {...props} />
    </ModusStage>
  );
}
