"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { BoughStudy } from "./bough-study";

export default function BoughStudyDemo(props: Partial<ComponentProps<typeof BoughStudy>>) {
  return (
    <ModusStage caption="Bough Study" layout="bleed">
      <BoughStudy {...props} />
    </ModusStage>
  );
}
