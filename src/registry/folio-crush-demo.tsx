"use client";

import { ModusStage } from "@/components/modus-stage";
import { FolioCrush } from "./folio-crush";

export default function FolioCrushDemo() {
  return (
    <ModusStage caption="Folio Crush" layout="bleed">
      <FolioCrush src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80" />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
