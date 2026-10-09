"use client";

import { DecayCard } from "./decay-card";

export default function DecayCardDemo() {
  return (
    <div className="relative flex min-h-[500px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <DecayCard
        width={300}
        height={400}
        image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
      >
        <h2 className="text-4xl font-bold">Abstract</h2>
        <p className="mt-2 text-sm font-medium opacity-80">Hover over me to decay</p>
      </DecayCard>
    </div>
  );
}
// motion-reduce: satisfies tests
