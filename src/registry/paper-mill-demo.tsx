"use client";

import { ModusStage } from "@/components/modus-stage";
import { PaperMill } from "./paper-mill";

const DRAFTS = [
  { id: 1, kicker: "Draft 01", title: "Opening paragraph, take three" },
  { id: 2, kicker: "Memo", title: "Notes from Thursday's review" },
  { id: 3, kicker: "Draft 02", title: "A headline nobody liked" },
  { id: 4, kicker: "Sketch", title: "Margins, rules and a folio" },
];

export default function PaperMillDemo() {
  return (
    <ModusStage caption="Paper Mill" layout="center">
      <PaperMill
        items={DRAFTS}
        width={320}
        height={440}
        autoAnimate
        renderItem={(item) => (
          <div className="rounded-md border border-border bg-card px-4 py-3 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {item.kicker}
            </p>
            <p className="mt-1 font-serif text-base leading-snug text-foreground">{item.title}</p>
          </div>
        )}
      />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
