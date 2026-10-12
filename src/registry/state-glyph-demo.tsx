"use client";

import { ModusStage } from "@/components/modus-stage";
import { StateGlyph } from "./state-glyph";

export default function StateGlyphDemo() {
  return (
    <ModusStage caption="State Glyph" layout="center">
      <div className="flex flex-col items-start gap-3">
        <StateGlyph status="done" label="Typeset" />
        <StateGlyph status="running" progress={0.62} label="Proofing" />
        <StateGlyph status="running" label="Imposing" />
        <StateGlyph status="failed" label="Plate check" />
        <StateGlyph label="Bind" />
      </div>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
