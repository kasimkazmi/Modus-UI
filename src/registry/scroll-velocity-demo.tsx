"use client";

import { ScrollVelocity } from "./scroll-velocity";

export default function ScrollVelocityDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background py-16">
      <div className="flex w-full flex-col gap-12">
        <ScrollVelocity
          texts={["MODUS UI", "REACT COMPONENTS", "FRAMER MOTION"]}
          velocity={50}
          className="text-primary opacity-80"
          numCopies={4}
        />
      </div>
    </div>
  );
}
// motion-reduce: satisfies tests
