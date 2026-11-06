"use client";

import { ModeProvider, useMode, type Mode } from "../mode-provider";

const MODES: Mode[] = ["light", "dark", "system"];

function Panel() {
  const { mode, scheme, setMode, toggle } = useMode();
  const dark = scheme === "dark";
  return (
    <div className="w-full max-w-sm space-y-4 p-6">
      <div
        className={`rounded-2xl border border-border p-5 ${dark ? "bg-neutral-900 text-neutral-50" : "bg-neutral-50 text-neutral-900"}`}
      >
        <p className="text-xs opacity-60">useMode()</p>
        <p aria-live="polite" className="text-lg font-extrabold">
          mode: {mode} · scheme: {scheme}
        </p>
      </div>
      <div role="radiogroup" aria-label="Mode" className="flex gap-2">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            aria-label={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
          >
            {m}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Toggle"
        onClick={toggle}
        className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
      >
        toggle()
      </button>
    </div>
  );
}

export default function ModeProviderWebDemo() {
  return (
    <ModeProvider initialMode="light">
      <Panel />
    </ModeProvider>
  );
}
