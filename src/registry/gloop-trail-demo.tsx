"use client";

import { ModusStage } from "@/components/modus-stage";
import { GloopTrail } from "./gloop-trail";

export default function GloopTrailDemo() {
  return (
    <ModusStage caption="Gloop Trail" layout="bleed">
      <div className="absolute inset-0 flex cursor-none flex-col items-center justify-center gap-3 text-center">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Pointer study
        </span>
        <h2 className="font-serif text-5xl text-foreground">Leave a trace</h2>
        <p className="font-sans text-sm text-muted-foreground">
          Ink pools and follows wherever you go.
        </p>
        <GloopTrail />
      </div>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
