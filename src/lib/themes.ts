/**
 * Site themes. Each id has a matching `[data-theme="<id>"]` block of tokens in
 * `src/app/globals.css`; `swatch` only colours the picker. Themes restyle the
 * Modus UI site, never the component previews, which stay pinned to `modus`.
 */
export const THEMES = [
  {
    id: "modus",
    label: "Modus",
    fonts: "Instrument Serif · DM Sans",
    swatch: ["#F7F5F3", "#37322F"],
  },
  { id: "slate", label: "Slate", fonts: "Inter", swatch: ["#F8FAFC", "#0F172A"] },
  { id: "midnight", label: "Midnight", fonts: "Space Grotesk", swatch: ["#0B1120", "#3B82F6"] },
  { id: "forest", label: "Forest", fonts: "Fraunces · Manrope", swatch: ["#F8F8F2", "#24704B"] },
  { id: "rose", label: "Rose", fonts: "Playfair Display · Inter", swatch: ["#FDF7F9", "#D6336C"] },
  { id: "mono", label: "Mono", fonts: "JetBrains Mono", swatch: ["#FFFFFF", "#0A0A0A"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "modus";
