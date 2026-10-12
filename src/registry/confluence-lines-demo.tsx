"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { ConfluenceLines } from "./confluence-lines";

export default function ConfluenceLinesDemo(
  props: Partial<ComponentProps<typeof ConfluenceLines>>,
) {
  return (
    <ModusStage caption="Confluence Lines" layout="bleed">
      <ConfluenceLines {...props} />
    </ModusStage>
  );
}
