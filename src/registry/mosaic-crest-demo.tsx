"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { MosaicCrest } from "./mosaic-crest";

export default function MosaicCrestDemo(props: Partial<ComponentProps<typeof MosaicCrest>>) {
  return (
    <ModusStage caption="Mosaic Crest" layout="bleed">
      <MosaicCrest {...props} />
    </ModusStage>
  );
}
