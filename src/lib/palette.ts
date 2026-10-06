"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_PALETTE, PALETTES, PALETTE_STORAGE_KEY, type PaletteId } from "@/lib/themes";

/*
 * The palette lives on `<html data-palette>`. `paletteScript` (themes.ts) sets it from
 * localStorage before first paint (next-themes does the same for light/dark,
 * but it supports a single setting, so the palette is handled here).
 */

const CHANGE_EVENT = "modus-palette-change";

const isPalette = (value: unknown): value is PaletteId =>
  PALETTES.some((palette) => palette.id === value);

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    // Keep tabs in sync, like next-themes does for light/dark.
    if (event.key === PALETTE_STORAGE_KEY && isPalette(event.newValue)) {
      document.documentElement.setAttribute("data-palette", event.newValue);
      onChange();
    }
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): PaletteId {
  const value = document.documentElement.getAttribute("data-palette");
  return isPalette(value) ? value : DEFAULT_PALETTE;
}

export function usePalette() {
  const palette = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_PALETTE);

  const setPalette = useCallback((next: PaletteId) => {
    document.documentElement.setAttribute("data-palette", next);
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice still applies for this page.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { palette, setPalette };
}
