"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { InkFountain } from "./ink-fountain";

export default function InkFountainDemo(props: Partial<ComponentProps<typeof InkFountain>>) {
  return (
    <ModusStage caption="Ink Fountain" layout="bleed">
      <InkFountain {...props} />
    </ModusStage>
  );
}
