/** Every colour a screen needs, by role rather than by shade, so light and dark can swap freely. */
export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  border: string;
  destructive: string;
}

export const lightColors: ThemeColors = {
  background: "#ffffff",
  foreground: "#111827",
  card: "#f9fafb",
  muted: "#f3f4f6",
  mutedForeground: "#6b7280",
  primary: "#4f46e5",
  primaryForeground: "#ffffff",
  border: "#e5e7eb",
  destructive: "#dc2626",
};

export const darkColors: ThemeColors = {
  background: "#0b0b0f",
  foreground: "#f9fafb",
  card: "#16161d",
  muted: "#1f1f29",
  mutedForeground: "#9ca3af",
  primary: "#818cf8",
  primaryForeground: "#0b0b0f",
  border: "#2a2a36",
  destructive: "#f87171",
};

/**
 * Adds transparency to a #rrggbb colour and returns an rgba() string. `alpha` runs from 0 to 1. Use it
 * for overlays and pressed states so they stay tied to the palette instead of being hard-coded.
 */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
