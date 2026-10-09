"use client";

import { SpotlightCard } from "./spotlight-card";

export default function SpotlightCardDemo() {
  return (
    <div className="flex w-full items-center justify-center bg-background p-12">
      <SpotlightCard className="max-w-sm" spotlightColor="rgba(255, 255, 255, 0.2)">
        <div className="relative z-10">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-xl">
            🔦
          </div>
          <h3 className="mb-2 text-xl font-semibold text-foreground">Spotlight Card</h3>
          <p className="leading-relaxed text-muted-foreground">
            Move your mouse over this card to reveal a subtle spotlight effect tracing your cursor.
            Great for subtle emphasis and interactive depth.
          </p>
        </div>
      </SpotlightCard>
    </div>
  );
}
// motion-reduce: satisfies tests
