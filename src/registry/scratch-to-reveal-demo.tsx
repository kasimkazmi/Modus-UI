"use client";

import { ScratchToReveal } from "./scratch-to-reveal";

export default function ScratchToRevealDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <ScratchToReveal
        width={300}
        height={300}
        brushSize={40}
        threshold={0.6}
        overlayColor="hsl(var(--primary))"
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-secondary/50 p-6 text-center">
          <span className="mb-2 text-5xl">🎉</span>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">You Won!</h3>
          <p className="mt-2 text-sm text-muted-foreground">Enjoy your prize.</p>
        </div>
      </ScratchToReveal>
    </div>
  );
}
