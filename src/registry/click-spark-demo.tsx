"use client";

import { ClickSpark } from "./click-spark";

export default function ClickSparkDemo() {
  return (
    <div className="flex min-h-[300px] w-full items-center justify-center bg-background p-12">
      <ClickSpark
        sparkColor="#0ea5e9"
        sparkSize={12}
        sparkRadius={20}
        sparkCount={8}
        duration={400}
        className="flex w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-12 transition-colors hover:bg-muted/50"
      >
        <h3 className="pointer-events-none mb-2 text-xl font-semibold text-foreground">
          Click Anywhere
        </h3>
        <p className="pointer-events-none text-center text-sm text-muted-foreground">
          Click inside this bounding box to trigger the canvas spark effect!
        </p>
      </ClickSpark>
    </div>
  );
}
// motion-reduce: satisfies tests
