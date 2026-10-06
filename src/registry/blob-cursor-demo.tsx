"use client";

import { BlobCursor } from "./blob-cursor";

export default function BlobCursorDemo() {
  return (
    <div className="group relative flex min-h-[400px] w-full cursor-none items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      {/* Difference blending keeps the text readable over both the page and the blob. */}
      <div className="pointer-events-none relative z-10 text-center text-white mix-blend-difference">
        <h2 className="text-4xl font-bold tracking-tight">Move your mouse</h2>
        <p className="mt-2 opacity-70">The blob will trail your cursor</p>
      </div>

      {/* The blob cursor only lives inside this box */}
      <BlobCursor />
    </div>
  );
}
