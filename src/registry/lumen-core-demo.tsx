"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { LumenCore } from "./lumen-core";

export default function LumenCoreDemo(props: Partial<ComponentProps<typeof LumenCore>>) {
  return (
    <ModusStage caption="Lumen Core" layout="bleed">
      <LumenCore {...props} />
    </ModusStage>
  );
}
