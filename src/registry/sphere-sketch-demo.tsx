"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { SphereSketch } from "./sphere-sketch";

export default function SphereSketchDemo(props: Partial<ComponentProps<typeof SphereSketch>>) {
  return (
    <ModusStage caption="Sphere Sketch" layout="bleed">
      <SphereSketch {...props} />
    </ModusStage>
  );
}
