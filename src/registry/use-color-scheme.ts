import { useColorScheme as useSystemScheme } from "react-native";

export type Scheme = "light" | "dark";

/**
 * The system colour scheme, always "light" or "dark". React Native's own hook can return null before
 * the platform reports a value; this one falls back to light so styles never see a missing scheme.
 * It re-renders when the user switches appearance.
 */
export function useColorScheme(): Scheme {
  return useSystemScheme() === "dark" ? "dark" : "light";
}
