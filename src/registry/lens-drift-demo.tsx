"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { LensDrift } from "./lens-drift";

export default function LensDriftDemo(props: Partial<ComponentProps<typeof LensDrift>>) {
  return (
    <ModusStage caption="Lens Drift" layout="bleed">
      <LensDrift {...props} />
    </ModusStage>
  );
}
