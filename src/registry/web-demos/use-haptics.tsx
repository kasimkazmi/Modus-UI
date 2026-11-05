"use client";

import { useState } from "react";
import { useHaptics } from "../use-haptics";

const KINDS = ["tap", "success", "warning", "error"] as const;

export default function UseHapticsWebDemo() {
  const [enabled, setEnabled] = useState(true);
  const [last, setLast] = useState("Nothing yet");
  const haptics = useHaptics(enabled);

  return (
    <div className="w-full max-w-sm space-y-4 p-6">
      <h3 className="text-xl font-bold">Haptics</h3>
      <div className="flex flex-wrap gap-2">
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-label={`Fire ${kind}`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition active:scale-95"
            onClick={() => {
              haptics[kind]();
              setLast(enabled ? kind : `${kind} (off)`);
            }}
          >
            {kind}
          </button>
        ))}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Haptics enabled"
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium"
        onClick={() => setEnabled(!enabled)}
      >
        Enabled: {enabled ? "on" : "off"}
      </button>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Last fired: {last}. You will feel it on an Android phone in Chrome.
      </p>
    </div>
  );
}
