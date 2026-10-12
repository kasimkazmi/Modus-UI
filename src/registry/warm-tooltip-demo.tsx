"use client";

import { WarmTooltip } from "./warm-tooltip";

export default function WarmTooltipDemo() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-12">
      <div className="flex gap-3">
        {["Copy", "Share", "Delete"].map((label) => (
          <WarmTooltip key={label} content={label}>
            <button className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground">
              {label}
            </button>
          </WarmTooltip>
        ))}
      </div>
    </div>
  );
}
// motion-reduce: satisfies tests
