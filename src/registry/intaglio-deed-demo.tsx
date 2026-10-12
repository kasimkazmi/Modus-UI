"use client";

import { ModusStage } from "@/components/modus-stage";
import { IntaglioDeed } from "./intaglio-deed";

export default function IntaglioDeedDemo() {
  return (
    <ModusStage caption="Intaglio Deed" layout="bleed" className="min-h-[600px]">
      <div className="absolute inset-0">
        <IntaglioDeed backgroundColor="transparent" />
      </div>
    </ModusStage>
  );
}
