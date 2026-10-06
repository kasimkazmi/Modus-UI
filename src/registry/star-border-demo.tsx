"use client";

import { StarBorder } from "./star-border";

export default function StarBorderDemo() {
  return (
    <div className="relative flex w-full items-center justify-center min-h-[400px] overflow-hidden rounded-xl border border-border bg-background">
      <StarBorder as="button" speed={4} color="rgba(168, 85, 247, 0.8)">
        Premium Features
      </StarBorder>
    </div>
  );
}
