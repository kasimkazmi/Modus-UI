"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { PrismKey } from "@/registry/prism-key";

export default function PrismKeyDemo(props: Partial<ComponentProps<typeof PrismKey>>) {
  return (
    <ModusStage caption="Prism Key" layout="center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <PrismKey {...props} />
    </ModusStage>
  );
}
