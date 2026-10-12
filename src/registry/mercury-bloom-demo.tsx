"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { MercuryBloom } from "./mercury-bloom";

export default function MercuryBloomDemo(props: Partial<ComponentProps<typeof MercuryBloom>>) {
  return (
    <ModusStage caption="Mercury Bloom" layout="bleed">
      <MercuryBloom {...props} />
    </ModusStage>
  );
}
