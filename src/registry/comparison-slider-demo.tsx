"use client";

import { ComparisonSlider } from "./comparison-slider";

export default function ComparisonSliderDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full max-w-2xl items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-4">
      <ComparisonSlider
        before={
          <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-2xl font-bold text-white">
            Dark Mode
          </div>
        }
        after={
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-2xl font-bold text-zinc-900">
            Light Mode
          </div>
        }
      />
    </div>
  );
}
// motion-reduce: satisfies tests
