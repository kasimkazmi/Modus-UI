"use client";

import { FuzzyText } from "./fuzzy-text";

export default function FuzzyTextDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <FuzzyText baseIntensity={0.2} hoverIntensity={0.8} color="hsl(var(--foreground))">
        Fuzzy
      </FuzzyText>
      <p className="mt-4 text-sm text-muted-foreground">Hover to increase fuzziness</p>
    </div>
  );
}
// motion-reduce: satisfies tests
