"use client";

import { useSyncExternalStore } from "react";

export type Scheme = "light" | "dark";

const QUERY = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * The system colour scheme, always "light" or "dark". It reads the prefers-color-scheme media query and
 * re-renders when the person switches appearance. On the server, and for the first render while
 * hydrating, it returns "light" so the markup matches.
 */
export function useColorScheme(): Scheme {
  return useSyncExternalStore(
    subscribe,
    () => (window.matchMedia(QUERY).matches ? "dark" : "light"),
    () => "light",
  );
}
