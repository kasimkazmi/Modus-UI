"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { InkPill } from "./ink-pill";

export default function InkPillDemo(props: Partial<ComponentProps<typeof InkPill>>) {
  return (
    <ModusStage caption="Ink Pill" layout="bleed">
      <div className="absolute inset-0 grid grid-cols-1 sm:grid-cols-2">
        <InkPill {...props} />
        <InkPill variant="ghost" label="Read the notes" />
      </div>
    </ModusStage>
  );
}
