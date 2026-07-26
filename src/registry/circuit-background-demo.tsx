"use client";

import React from "react";
import { CircuitBackground } from "./circuit-background";

export function CircuitBackgroundDemo() {
  return (
    <div className="relative min-h-[400px] w-full flex flex-col items-center justify-center border-2 border-[#3F3F46] rounded-none overflow-hidden bg-[#09090B] z-0">
      {/* Background canvas restricted to this preview demo element container using absolute positioning */}
      <div className="absolute inset-0 -z-10 bg-black/40">
        <CircuitBackground className="absolute inset-0" />
      </div>

      <div className="relative z-20 text-center max-w-md p-8 bg-black/90 rounded-none border-2 border-[#3F3F46] shadow-none space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#DFE104]">
          BACKGROUND SYSTEM
        </span>
        <h4 className="font-sans text-3xl font-bold uppercase tracking-tighter text-[#FAFAFA]">
          CIRCUIT ENERGY
        </h4>
        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          Move your mouse across this area or click to emit acid-yellow ripple waves. Watch ambient technical trails grow, turn at angles, and fade away in the background.
        </p>
      </div>
    </div>
  );
}
