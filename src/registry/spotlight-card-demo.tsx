"use client";

import { SpotlightCard } from "./spotlight-card";

export default function SpotlightCardDemo() {
  return (
    <div className="flex w-full items-center justify-center p-12 bg-background">
      <SpotlightCard className="max-w-sm" spotlightColor="rgba(255, 255, 255, 0.2)">
        <div className="relative z-10">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-xl mb-4">
            🔦
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Spotlight Card</h3>
          <p className="text-muted-foreground leading-relaxed">
            Move your mouse over this card to reveal a subtle spotlight effect tracing your cursor.
            Great for subtle emphasis and interactive depth.
          </p>
        </div>
      </SpotlightCard>
    </div>
  );
}
