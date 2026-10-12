"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { Inkwell } from "./inkwell";

export default function InkwellDemo(props: Partial<ComponentProps<typeof Inkwell>>) {
  return (
    <ModusStage caption="Inkwell" layout="bleed">
      <Inkwell {...props} />
    </ModusStage>
  );
}
