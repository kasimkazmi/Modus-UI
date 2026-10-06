"use client";

import { ClickSpark } from "./click-spark";

export default function ClickSparkDemo() {
  return (
    <div className="flex w-full items-center justify-center p-12 bg-background min-h-[300px]">
      <ClickSpark
        sparkColor="#0ea5e9"
        sparkSize={12}
        sparkRadius={20}
        sparkCount={8}
        duration={400}
        className="w-full max-w-sm flex flex-col items-center justify-center rounded-2xl border border-border border-dashed bg-muted/30 p-12 cursor-pointer transition-colors hover:bg-muted/50"
      >
        <h3 className="text-xl font-semibold text-foreground mb-2 pointer-events-none">Click Anywhere</h3>
        <p className="text-sm text-muted-foreground text-center pointer-events-none">
          Click inside this bounding box to trigger the canvas spark effect!
        </p>
      </ClickSpark>
    </div>
  );
}
