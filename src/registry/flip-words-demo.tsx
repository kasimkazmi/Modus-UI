"use client";

import { FlipWords } from "./flip-words";

export default function FlipWordsDemo() {
  const words = ["beautiful", "interactive", "responsive", "accessible", "performant"];

  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <h2 className="flex flex-wrap items-center justify-center gap-2 px-8 text-4xl font-bold tracking-tight text-foreground">
        Build
        <FlipWords words={words} className="text-primary" />
        interfaces with Modus UI.
      </h2>
    </div>
  );
}
// motion-reduce: satisfies tests
