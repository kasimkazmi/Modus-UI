"use client";

import React from "react";
import { PulseButton } from "./pulse-button";

export function PulseButtonDemo() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-12">
      <PulseButton className="bg-primary px-8 py-4 text-lg text-primary-foreground">
        Live Action
      </PulseButton>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground opacity-50">
        Organic Pulse Effect
      </p>
    </div>
  );
}
