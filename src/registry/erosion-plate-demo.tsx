"use client";

import { ModusStage } from "@/components/modus-stage";
import { ErosionPlate } from "./erosion-plate";

export default function ErosionPlateDemo() {
  return (
    <ModusStage caption="Erosion Plate" layout="center">
      <ErosionPlate width={280} height={380}>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Plate No. 07
        </span>
        <h2 className="mt-2 font-serif text-3xl leading-tight">Weathered light</h2>
        <p className="mt-2 font-sans text-sm text-muted-foreground">Move the cursor to erode it.</p>
      </ErosionPlate>
    </ModusStage>
  );
}
