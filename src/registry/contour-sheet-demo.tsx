"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { ContourSheet } from "./contour-sheet";

export default function ContourSheetDemo(props: Partial<ComponentProps<typeof ContourSheet>>) {
  return (
    <ModusStage caption="Contour Sheet" layout="bleed">
      <ContourSheet {...props} />
    </ModusStage>
  );
}
