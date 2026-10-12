"use client";

import { ModusStage } from "@/components/modus-stage";
import { EmberHint } from "./ember-hint";

export default function EmberHintDemo() {
  return (
    <ModusStage caption="Ember Hint" layout="center">
      <div className="flex gap-3">
        {["Bold", "Italic", "Quote"].map((label) => (
          <EmberHint key={label} content={label}>
            <button className="rounded-md border border-border bg-card px-3 py-1.5 font-serif text-sm text-foreground">
              {label}
            </button>
          </EmberHint>
        ))}
      </div>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
