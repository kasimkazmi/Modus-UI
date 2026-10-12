"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { DotWhirl } from "./dot-whirl";

export default function DotWhirlDemo(props: Partial<ComponentProps<typeof DotWhirl>>) {
  return (
    <ModusStage caption="Dot Whirl" layout="bleed">
      <DotWhirl {...props} />
    </ModusStage>
  );
}
