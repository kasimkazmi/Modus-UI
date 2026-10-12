"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { EMBLEM_GLOBE_BRANDS, EmblemGlobe } from "./emblem-globe";

export default function EmblemGlobeDemo(props: Partial<ComponentProps<typeof EmblemGlobe>>) {
  return (
    <ModusStage caption="Emblem Globe" layout="center">
      <div className="flex w-full max-w-2xl flex-col items-center gap-10">
        <div className="flex items-center gap-4 rounded-full border border-border bg-card py-2 pl-2 pr-5">
          <div className="h-14 w-14">
            <EmblemGlobe {...props} />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Composing…
          </span>
        </div>
        <div className="grid grid-cols-6 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-8">
          {EMBLEM_GLOBE_BRANDS.map((brand) => (
            <div key={brand} className="h-14 w-14 bg-background" title={brand}>
              <EmblemGlobe brand={brand} color="hsl(var(--foreground))" />
            </div>
          ))}
        </div>
      </div>
    </ModusStage>
  );
}
