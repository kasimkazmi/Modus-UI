"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { CrownBar } from "./crown-bar";

export default function CrownBarDemo(props: Partial<ComponentProps<typeof CrownBar>>) {
  return (
    <ModusStage caption="Crown Bar" layout="bleed">
      <div className="absolute inset-0">
        <CrownBar {...props} />
      </div>
    </ModusStage>
  );
}
