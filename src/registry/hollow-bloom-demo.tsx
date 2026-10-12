"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { HollowBloom } from "./hollow-bloom";

export default function HollowBloomDemo(props: Partial<ComponentProps<typeof HollowBloom>>) {
  return (
    <ModusStage caption="Hollow Bloom" layout="bleed">
      <HollowBloom {...props} />
    </ModusStage>
  );
}
