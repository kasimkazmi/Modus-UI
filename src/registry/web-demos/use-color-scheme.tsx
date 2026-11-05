"use client";

import { useColorScheme } from "../use-color-scheme";

export default function UseColorSchemeWebDemo() {
  const scheme = useColorScheme();
  return (
    <div className="w-full max-w-sm space-y-4 p-6">
      <p className="text-sm text-muted-foreground">useColorScheme() returned</p>
      <div
        className={`rounded-2xl border border-border p-5 ${scheme === "dark" ? "bg-neutral-950 text-neutral-50" : "bg-white text-neutral-900"}`}
      >
        <p aria-live="polite" className="text-3xl font-extrabold">
          {scheme}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        It follows your device. Change your system appearance and the card flips.
      </p>
    </div>
  );
}
