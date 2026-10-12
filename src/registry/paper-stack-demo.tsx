"use client";

import { ModusStage } from "@/components/modus-stage";
import { PaperStack } from "./paper-stack";

export default function PaperStackDemo() {
  return (
    <ModusStage caption="Paper Stack" layout="center">
      <PaperStack sublabel="4 notes" className="mt-28" />
    </ModusStage>
  );
}
