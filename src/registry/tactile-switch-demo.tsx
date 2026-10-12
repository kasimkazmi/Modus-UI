"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { TactileSwitch } from "./tactile-switch";

export default function TactileSwitchDemo(props: Partial<ComponentProps<typeof TactileSwitch>>) {
  return (
    <ModusStage caption="Tactile Switch" layout="bleed">
      <div className="absolute inset-0">
        <TactileSwitch {...props} />
      </div>
    </ModusStage>
  );
}
