"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * Whether the person has asked the system to reduce motion. It reads the prefers-reduced-motion media
 * query and follows later changes, so animated components can skip or shorten their motion. On the
 * server, and for the first render while hydrating, it returns false so the markup matches.
 */
export function useReduceMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
