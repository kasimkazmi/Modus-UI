"use client";

import { BorderBeam } from "./border-beam";

export default function BorderBeamDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <div className="relative flex h-[200px] w-full max-w-[300px] flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <span className="mb-4 text-4xl">✨</span>
        <h3 className="mb-1 text-lg font-semibold text-foreground">Animated Borders</h3>
        <p className="text-sm text-muted-foreground">
          Endlessly rotating beams around any container.
        </p>
        <BorderBeam size={100} duration={6} />
      </div>
    </div>
  );
}
