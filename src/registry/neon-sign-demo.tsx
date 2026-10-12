"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { NeonSign } from "./neon-sign";

export default function NeonSignDemo(props: Partial<ComponentProps<typeof NeonSign>>) {
  return (
    <ModusStage caption="Neon Sign" layout="bleed">
      <div className="absolute inset-0">
        <NeonSign {...props} />
      </div>
    </ModusStage>
  );
}
