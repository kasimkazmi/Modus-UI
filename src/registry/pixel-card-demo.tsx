"use client";

import { PixelCard } from "./pixel-card";

export default function PixelCardDemo() {
  return (
    <div className="relative flex w-full items-center justify-center min-h-[500px] overflow-hidden rounded-xl border border-border bg-background py-10">
      <div className="flex flex-col sm:flex-row gap-6">
        <PixelCard variant="default">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-foreground">Hover Me</span>
          </div>
        </PixelCard>
        
        <PixelCard variant="blue">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-blue-500 drop-shadow-md">Blue Variant</span>
          </div>
        </PixelCard>
      </div>
    </div>
  );
}
