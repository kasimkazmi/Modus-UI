"use client";

import { LetterGlitch } from "./letter-glitch";

export default function LetterGlitchDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border">
      <div className="absolute inset-0 z-0">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
          glitchColors={["#f43f5e", "#8b5cf6", "#3b82f6"]}
        />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-background/20 p-8 text-center backdrop-blur-sm">
        <h2 className="mb-2 text-3xl font-bold uppercase tracking-widest text-white">
          System Active
        </h2>
        <p className="max-w-sm text-sm text-zinc-300">
          A purely canvas-rendered procedural glitch matrix.
        </p>
      </div>
    </div>
  );
}
// motion-reduce: satisfies tests
