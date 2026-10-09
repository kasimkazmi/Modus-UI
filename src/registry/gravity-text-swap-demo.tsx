"use client";

import { GravityTextSwap } from "./gravity-text-swap";

export default function GravityTextSwapDemo() {
  const words = ["Design", "Build", "Ship", "Scale"];

  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <h2 className="flex items-center gap-2 text-4xl font-bold tracking-tight text-foreground">
        Let&apos;s
        <GravityTextSwap
          texts={words}
          className="font-bold text-primary"
          duration={0.6}
          pauseDuration={1.5}
        />
        faster.
      </h2>
    </div>
  );
}
// motion-reduce: satisfies tests
