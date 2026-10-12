"use client";

import { ModusStage } from "@/components/modus-stage";
import { GlideLedgerRow } from "./glide-ledger-row";

const ENTRIES = [
  ["Folio 12", "Proof returned with notes"],
  ["Folio 13", "Awaiting the second read"],
  ["Folio 14", "Set in type, ready to bind"],
];

export default function GlideLedgerRowDemo() {
  return (
    <ModusStage caption="Ledger Row" layout="center">
      <div className="flex w-full max-w-sm flex-col gap-2">
        {ENTRIES.map(([k, v]) => (
          <GlideLedgerRow key={k} label={k}>
            <div className="flex flex-col gap-0.5 px-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {k}
              </span>
              <span className="font-serif text-base text-foreground">{v}</span>
            </div>
          </GlideLedgerRow>
        ))}
      </div>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
