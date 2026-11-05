"use client";

import { useKeyboardHeight } from "../use-keyboard-height";

export default function UseKeyboardHeightWebDemo() {
  const height = useKeyboardHeight();
  return (
    <div className="w-full max-w-sm space-y-3 p-6">
      <p className="text-sm text-muted-foreground">useKeyboardHeight() returned</p>
      <p aria-live="polite" className="text-4xl font-extrabold">
        {height}
      </p>
      <p className="text-xs text-muted-foreground">
        On a phone browser this is the keyboard&apos;s height while it is open, so you can lift a
        bar above it. It stays 0 on desktop.
      </p>
      <input
        aria-label="Message"
        placeholder="Type a message"
        className="h-12 w-full rounded-xl border border-border bg-card px-4 text-base"
        style={{ marginBottom: height }}
      />
    </div>
  );
}
