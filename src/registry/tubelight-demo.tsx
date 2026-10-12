"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { Tubelight } from "./tubelight";

export default function TubelightDemo(props: Partial<ComponentProps<typeof Tubelight>>) {
  return (
    <ModusStage caption="Tubelight" layout="bleed">
      <div className="absolute inset-0">
        <Tubelight {...props} />
      </div>
    </ModusStage>
  );
}
