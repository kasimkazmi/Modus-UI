"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { WordSwarm } from "./word-swarm";

export default function WordSwarmDemo(props: Partial<ComponentProps<typeof WordSwarm>>) {
  return (
    <ModusStage caption="Word Swarm" layout="bleed">
      <WordSwarm {...props} />
    </ModusStage>
  );
}
