/**
 * Site palettes. Each id has a light `[data-palette="<id>"]` block and a
 * `.dark[data-palette="<id>"]` block of tokens in `src/app/globals.css`;
 * `swatch` only colours the picker. Palettes restyle the Modus UI site, never
 * the component previews, which stay pinned to light `modus`.
 */
export const PALETTES = [
  {
    id: "modus",
    label: "Modus",
    fonts: "Instrument Serif · DM Sans",
    swatch: ["#F7F5F3", "#37322F"],
  },
  { id: "slate", label: "Slate", fonts: "Inter", swatch: ["#F2F4F7", "#0F1729"] },
  { id: "ocean", label: "Ocean", fonts: "Space Grotesk", swatch: ["#F2F4F8", "#156BF4"] },
  { id: "forest", label: "Forest", fonts: "Fraunces · Manrope", swatch: ["#F4F6F3", "#24704C"] },
  { id: "rose", label: "Rose", fonts: "Playfair Display · Inter", swatch: ["#F8F2F4", "#D5346A"] },
  { id: "mono", label: "Mono", fonts: "JetBrains Mono", swatch: ["#F5F5F5", "#0A0A0A"] },
  { id: "sunset", label: "Sunset", fonts: "Manrope", swatch: ["#F8F4F2", "#F0530F"] },
  { id: "lavender", label: "Lavender", fonts: "Fraunces · Inter", swatch: ["#F4F2F8", "#7B4ACF"] },
  { id: "teal", label: "Teal", fonts: "Space Grotesk · Inter", swatch: ["#F3F7F7", "#158479"] },
  {
    id: "crimson",
    label: "Crimson",
    fonts: "Playfair Display · DM Sans",
    swatch: ["#F6F3F4", "#B81E38"],
  },
  {
    id: "amber",
    label: "Amber",
    fonts: "Instrument Serif · Manrope",
    swatch: ["#F8F6F2", "#F59F0A"],
  },
  { id: "nord", label: "Nord", fonts: "Inter", swatch: ["#F3F4F6", "#4E6F97"] },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];

export const DEFAULT_PALETTE: PaletteId = "modus";

/** localStorage key for the chosen palette. Light/dark is stored by next-themes. */
export const PALETTE_STORAGE_KEY = "modus-palette";

/** Inline, render-blocking script for `<head>`; keep it dependency-free. */
export const paletteScript = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  PALETTE_STORAGE_KEY,
)});var ok=${JSON.stringify(PALETTES.map((palette) => palette.id))};document.documentElement.setAttribute("data-palette",ok.indexOf(p)>-1?p:${JSON.stringify(
  DEFAULT_PALETTE,
)})}catch(e){document.documentElement.setAttribute("data-palette",${JSON.stringify(DEFAULT_PALETTE)})}})()`;
