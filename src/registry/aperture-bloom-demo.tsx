"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { ApertureBloom } from "./aperture-bloom";

export default function ApertureBloomDemo(props: Partial<ComponentProps<typeof ApertureBloom>>) {
  return (
    <ModusStage caption="Aperture Bloom" layout="bleed">
      <ApertureBloom {...props} />
    </ModusStage>
  );
}
