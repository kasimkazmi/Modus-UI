"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { BUTTON_ATLAS_VARIANTS, ButtonAtlas } from "./button-atlas";

export default function ButtonAtlasDemo(props: Partial<ComponentProps<typeof ButtonAtlas>>) {
  if (props.variant) {
    return (
      <ModusStage caption="Button Atlas" layout="center">
        <ButtonAtlas className="min-h-[300px]" {...props} />
      </ModusStage>
    );
  }

  return (
    <ModusStage caption="Button Atlas" layout="center">
      <div className="grid w-full grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
        {BUTTON_ATLAS_VARIANTS.map((variant, index) => (
          <div key={variant} className="relative h-[150px] bg-background">
            <ButtonAtlas {...props} variant={variant} />
            <span className="pointer-events-none absolute left-3 top-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {String(index + 1).padStart(2, "0")} / {variant}
            </span>
          </div>
        ))}
      </div>
    </ModusStage>
  );
}
