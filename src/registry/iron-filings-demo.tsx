"use client";

import { ModusStage } from "@/components/modus-stage";
import { IronFilings } from "./iron-filings";

export default function IronFilingsDemo() {
  return (
    <ModusStage caption="Iron Filings" layout="bleed">
      <div className="absolute inset-0 flex items-center justify-center">
        <IronFilings containerSize="320px" lineHeight="16px" lineWidth="2px" />
      </div>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
