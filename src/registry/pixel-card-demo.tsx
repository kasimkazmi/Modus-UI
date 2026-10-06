"use client";

import { PixelCard } from "./pixel-card";

export default function PixelCardDemo() {
  return (
    <div className="relative flex min-h-[500px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background py-10">
      <div className="flex flex-col gap-6 sm:flex-row">
        <PixelCard variant="default">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-foreground">Hover Me</span>
          </div>
        </PixelCard>

        <PixelCard variant="blue">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-blue-500 drop-shadow-md">Blue Variant</span>
          </div>
        </PixelCard>
      </div>
    </div>
  );
}
