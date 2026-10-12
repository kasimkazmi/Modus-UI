"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { ContourStream } from "./contour-stream";

export default function ContourStreamDemo(props: Partial<ComponentProps<typeof ContourStream>>) {
  return (
    <ModusStage caption="Contour Stream" layout="bleed">
      <ContourStream {...props} />
    </ModusStage>
  );
}
