"use client";

import { ModusStage } from "@/components/modus-stage";
import { FolioOpening } from "@/registry/folio-opening";

export default function FolioOpeningDemo() {
  return (
    <ModusStage caption="Folio Opening" layout="bleed">
      <div className="absolute inset-0">
        <FolioOpening />
      </div>
    </ModusStage>
  );
}
