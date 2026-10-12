"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { ArchCurrent } from "./arch-current";

export default function ArchCurrentDemo(props: Partial<ComponentProps<typeof ArchCurrent>>) {
  return (
    <ModusStage caption="Arch Current" layout="bleed">
      <ArchCurrent {...props} />
    </ModusStage>
  );
}
