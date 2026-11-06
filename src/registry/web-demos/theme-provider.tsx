"use client";

import { ModeProvider, useMode } from "../mode-provider";
import { ThemeProvider, useTheme } from "../theme-provider";

function Card() {
  const { colors } = useTheme();
  const { toggle, scheme } = useMode();
  const next = scheme === "dark" ? "light" : "dark";
  return (
    <div className="w-full max-w-sm p-6" style={{ background: colors.background }}>
      <div
        className="space-y-3 rounded-2xl p-5"
        style={{ background: colors.card, border: `1px solid ${colors.border}` }}
      >
        <h3 className="text-lg font-extrabold" style={{ color: colors.foreground }}>
          Themed card
        </h3>
        <p className="text-sm" style={{ color: colors.mutedForeground }}>
          Every colour here comes from useTheme(), not from the card itself.
        </p>
        <button
          type="button"
          aria-label={`Switch to ${next}`}
          onClick={toggle}
          className="rounded-lg px-4 py-2 text-sm font-bold"
          style={{ background: colors.primary, color: colors.primaryForeground }}
        >
          Switch to {next}
        </button>
      </div>
    </div>
  );
}

function Themed() {
  const { scheme } = useMode();
  return (
    <ThemeProvider
      scheme={scheme}
      colors={{ light: { primary: "#0d9488" }, dark: { primary: "#2dd4bf" } }}
    >
      <Card />
    </ThemeProvider>
  );
}

export default function ThemeProviderWebDemo() {
  return (
    <ModeProvider initialMode="light">
      <Themed />
    </ModeProvider>
  );
}
