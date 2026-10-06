"use client";

import React from "react";
import { CircuitBackground } from "./circuit-background";

export function CircuitBackgroundDemo() {
  return (
    <div className="relative z-0 flex min-h-[400px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#E0DEDB]/50 bg-white/20">
      {/* Background canvas restricted to this preview demo element container using absolute positioning */}
      <div className="absolute inset-0 -z-10 bg-[#FAF9F7]/10">
        <CircuitBackground className="absolute inset-0" />
      </div>

      <div className="relative z-20 max-w-md space-y-4 rounded-2xl border border-[#E0DEDB]/40 bg-white/80 p-6 text-center shadow-xl backdrop-blur-md">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#605A57]/60">
          Layout Element
        </span>
        <h4 className="font-serif text-3xl text-[#37322F]">Circuit Background</h4>
        <p className="text-xs leading-relaxed text-[#605A57]">
          Move your mouse across this area or click to emit soft ripple waves. Watch ambient
          technical trails grow, turn at angles, and fade away in the background.
        </p>
      </div>
    </div>
  );
}
