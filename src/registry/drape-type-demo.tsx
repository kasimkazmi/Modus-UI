"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { DrapeType } from "./drape-type";

export default function DrapeTypeDemo(props: Partial<ComponentProps<typeof DrapeType>>) {
  return (
    <ModusStage caption="Drape Type" layout="bleed">
      <DrapeType {...props} />
    </ModusStage>
  );
}
