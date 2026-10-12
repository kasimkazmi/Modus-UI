"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { PaceDial } from "./pace-dial";

export default function PaceDialDemo(props: Partial<ComponentProps<typeof PaceDial>>) {
  return (
    <ModusStage caption="Pace Dial" layout="center">
      <PaceDial className="max-w-[340px]" {...props} />
    </ModusStage>
  );
}
