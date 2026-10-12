"use client";

import { ModusStage } from "@/components/modus-stage";
import { DustSignature } from "./dust-signature";

export default function DustSignatureDemo() {
  return (
    <ModusStage caption="Dust Signature" layout="bleed">
      <div className="absolute inset-0">
        <DustSignature />
      </div>
    </ModusStage>
  );
}
