"use client";

import { ModusStage } from "@/components/modus-stage";
import { CoyKey } from "./coy-key";

export default function CoyKeyDemo() {
  return (
    <ModusStage caption="Coy Key" layout="center">
      <CoyKey className="max-w-md" />
    </ModusStage>
  );
}
