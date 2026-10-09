"use client";

import React from "react";
import { MagicButton } from "./magic-button";

export function MagicButtonDemo() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-12">
      <MagicButton />
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground opacity-50">
        Hover and Click for Interaction
      </p>
    </div>
  );
}
// motion-reduce: satisfies tests
