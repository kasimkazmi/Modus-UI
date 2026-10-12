"use client";

import { ModusStage } from "@/components/modus-stage";
import { TurnLeaf } from "./turn-leaf";

export default function TurnLeafDemo() {
  return (
    <ModusStage caption="Turn Leaf" layout="center">
      <TurnLeaf
        front={
          <div className="flex h-full flex-col justify-between p-7">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Folio 12 / Recto
            </span>
            <h3 className="font-serif text-4xl leading-[1.05]">The quiet page</h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Drag or press to turn
            </span>
          </div>
        }
        back={
          <div className="flex h-full flex-col justify-between bg-primary p-7 text-primary-foreground">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">
              Folio 12 / Verso
            </span>
            <p className="font-sans text-sm leading-relaxed opacity-90">
              Every leaf has two faces. Turn it back when you have read this one.
            </p>
          </div>
        }
      />
    </ModusStage>
  );
}
