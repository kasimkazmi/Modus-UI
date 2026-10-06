"use client";

import { LetterGlitch } from "./letter-glitch";

export default function LetterGlitchDemo() {
  return (
    <div className="relative flex w-full items-center justify-center min-h-[400px] overflow-hidden rounded-xl border border-border">
      <div className="absolute inset-0 z-0">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
          glitchColors={["#f43f5e", "#8b5cf6", "#3b82f6"]}
        />
      </div>
      <div className="relative z-10 p-8 flex flex-col items-center justify-center text-center backdrop-blur-sm bg-background/20 rounded-2xl border border-white/10">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-widest uppercase">System Active</h2>
        <p className="text-zinc-300 max-w-sm text-sm">
          A purely canvas-rendered procedural glitch matrix.
        </p>
      </div>
    </div>
  );
}
