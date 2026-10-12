"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { DustVeil } from "./dust-veil";

export default function DustVeilDemo(props: Partial<ComponentProps<typeof DustVeil>>) {
  return (
    <ModusStage caption="Dust Veil" layout="bleed">
      <DustVeil {...props} />
    </ModusStage>
  );
}
