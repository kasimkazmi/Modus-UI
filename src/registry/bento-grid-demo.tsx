"use client";

import { BentoGrid, BentoCard } from "./bento-grid";

export default function BentoGridDemo() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-background p-6">
      <BentoGrid columns={3} gap={16}>
        <BentoCard colSpan={2} className="min-h-[200px]">
          <h3 className="text-lg font-semibold">Main Feature</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This card spans two columns on medium screens and larger, drawing focus to primary
            content.
          </p>
        </BentoCard>

        <BentoCard colSpan={1} className="min-h-[200px]">
          <h3 className="text-lg font-semibold">Quick Stat</h3>
          <p className="mt-4 text-4xl font-bold tracking-tighter">99.9%</p>
        </BentoCard>

        <BentoCard colSpan={1} rowSpan={2} className="min-h-[300px]">
          <h3 className="text-lg font-semibold">Sidebar Tool</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Spans two rows to display vertical lists or deeper navigation.
          </p>
        </BentoCard>

        <BentoCard colSpan={2} className="min-h-[150px]">
          <h3 className="text-lg font-semibold">Bottom Banner</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Fills the remaining space nicely, creating a cohesive asymmetric layout.
          </p>
        </BentoCard>
      </BentoGrid>
    </div>
  );
}
