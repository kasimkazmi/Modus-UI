"use client";

import { ScratchToReveal } from "./scratch-to-reveal";

export default function ScratchToRevealDemo() {
  return (
    <div className="relative flex w-full items-center justify-center min-h-[400px] overflow-hidden rounded-xl border border-border bg-background">
      <ScratchToReveal
        width={300}
        height={300}
        brushSize={40}
        threshold={0.6}
        overlayColor="var(--primary)"
      >
        <div className="flex flex-col items-center justify-center text-center p-6 bg-secondary/50 w-full h-full rounded-xl">
          <span className="text-5xl mb-2">🎉</span>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">You Won!</h3>
          <p className="text-sm text-muted-foreground mt-2">Enjoy your prize.</p>
        </div>
      </ScratchToReveal>
    </div>
  );
}
