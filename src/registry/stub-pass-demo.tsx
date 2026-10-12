"use client";

import { ModusStage } from "@/components/modus-stage";
import { StubPass } from "./stub-pass";

export default function StubPassDemo() {
  return (
    <ModusStage caption="Stub Pass" layout="center">
      <StubPass
        stub={
          <div className="flex h-full flex-col items-center justify-center gap-1 text-primary-foreground">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Seat</span>
            <span className="font-serif text-4xl">14C</span>
          </div>
        }
      >
        <div className="flex h-full flex-col justify-between p-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Admit one · Evening reading
          </span>
          <span className="font-serif text-3xl leading-tight text-foreground">The Quiet Press</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Hall B · 19:30
          </span>
        </div>
      </StubPass>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
