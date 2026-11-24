"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { DotVeil } from "./dot-veil";

export default function DotVeilDemo(props: Partial<ComponentProps<typeof DotVeil>>) {
  return (
    <ModusStage caption="Dot Veil" layout="bleed">
      <DotVeil {...props} />
    </ModusStage>
  );
}
