"use client";

import { BlobCursor } from "./blob-cursor";

export default function BlobCursorDemo() {
  return (
    <div className="group relative flex min-h-[400px] w-full cursor-none items-center justify-center overflow-hidden rounded-xl border border-border bg-foreground">
      <div className="pointer-events-none relative z-10 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-background">Move your mouse</h2>
        <p className="mt-2 text-background/70">The blob will trail your cursor</p>
      </div>

      {/* The blob cursor only lives inside this box */}
      <BlobCursor fillColor="hsl(var(--primary))" />
    </div>
  );
}
