"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { LoomField } from "./loom-field";

export default function LoomFieldDemo(props: Partial<ComponentProps<typeof LoomField>>) {
  return (
    <ModusStage caption="Loom Field" layout="bleed" className="min-h-[520px]">
      <LoomField {...props} />
    </ModusStage>
  );
}
