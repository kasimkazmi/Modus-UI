"use client";

import React from "react";
import { PulseButton } from "./pulse-button";

export function PulseButtonDemo() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-12">
      <PulseButton className="bg-[#37322F] px-8 py-4 text-lg text-[#F7F5F3]">
        Live Action
      </PulseButton>
      <p className="text-xs font-medium uppercase tracking-widest text-[#605A57] opacity-50">
        Organic Pulse Effect
      </p>
    </div>
  );
}
