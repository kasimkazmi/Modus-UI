"use client";

import { Waves } from "./waves";

export default function WavesDemo() {
  return (
    <div className="relative flex w-full items-center justify-center min-h-[400px] overflow-hidden rounded-xl border border-border bg-background">
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
      <div className="relative z-10 p-8 flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold font-serif text-foreground mb-4">Wave Dynamics</h2>
        <p className="text-muted-foreground max-w-sm leading-relaxed">
          Move your mouse around to physically disturb the Perlin noise wave field.
        </p>
      </div>
    </div>
  );
}
