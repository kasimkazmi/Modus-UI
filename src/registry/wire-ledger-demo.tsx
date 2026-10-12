"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { WireLedger } from "./wire-ledger";

export default function WireLedgerDemo(props: Partial<ComponentProps<typeof WireLedger>>) {
  return (
    <ModusStage caption="Wire Ledger" layout="bleed">
      <WireLedger {...props} />
    </ModusStage>
  );
}
