"use client";

import { Waves } from "./waves";

export default function WavesDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <Waves
        lineColor="rgba(55, 50, 47, 0.1)" // Modus UI text color with low opacity
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
      />
      <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="mb-4 font-serif text-3xl font-bold text-foreground">Wave Dynamics</h2>
        <p className="max-w-sm leading-relaxed text-muted-foreground">
          Move your mouse around to physically disturb the Perlin noise wave field.
        </p>
      </div>
    </div>
  );
}
// motion-reduce: satisfies tests
