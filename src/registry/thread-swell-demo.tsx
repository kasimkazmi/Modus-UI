"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { ThreadSwell } from "./thread-swell";

export default function ThreadSwellDemo(props: Partial<ComponentProps<typeof ThreadSwell>>) {
  return (
    <ModusStage caption="Thread Swell" layout="bleed">
      <ThreadSwell {...props} />
    </ModusStage>
  );
}
