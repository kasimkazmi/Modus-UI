import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";

export interface ThemePalette {
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

export interface ThemeColors {
  light: Partial<ThemePalette>;
  dark: Partial<ThemePalette>;
}

const LIGHT: ThemePalette = {
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

const DARK: ThemePalette = {
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

export interface Theme {
  scheme: "light" | "dark";
  colors: ThemePalette;
}

const ThemeContext = createContext<Theme | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Which palette to use. Leave it out to follow the system; pass `useMode().scheme` to follow your own switch. */
  scheme?: "light" | "dark";
  /** Overrides for single colours in either palette. */
  colors?: Partial<ThemeColors>;
}

/**
 * Supplies one palette to everything below it. Components call `useTheme()` and read colours by role,
 * so switching between light and dark restyles the whole tree at once with no per-component logic.
 * Override individual colours with `colors`; anything you leave out keeps its default.
 */
export function ThemeProvider({ children, scheme, colors }: ThemeProviderProps) {
  const system = useColorScheme() === "dark" ? "dark" : "light";
  const active = scheme ?? system;

  const value = useMemo<Theme>(
    () => ({
      scheme: active,
      colors: active === "dark" ? { ...DARK, ...colors?.dark } : { ...LIGHT, ...colors?.light },
    }),
    [active, colors],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The active scheme and its colours. Throws when used outside a ThemeProvider. */
export function useTheme(): Theme {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside a ThemeProvider");
  return value;
}
