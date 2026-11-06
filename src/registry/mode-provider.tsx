"use client";

import {
  createContext,
  useCallback,
  useSyncExternalStore,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const QUERY = "(prefers-color-scheme: dark)";

/** The system scheme from the prefers-color-scheme media query; "light" on the server so hydration matches. */
function useSystemScheme(): "light" | "dark" {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(QUERY);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => (window.matchMedia(QUERY).matches ? "dark" : "light"),
    () => "light",
  );
}

export type Mode = "light" | "dark" | "system";

export interface ModeValue {
  /** What the person chose: light, dark, or follow the system. */
  mode: Mode;
  /** The scheme actually in effect, with "system" resolved to light or dark. */
  scheme: "light" | "dark";
  setMode: (mode: Mode) => void;
  /** Switches to the opposite of the scheme in effect. */
  toggle: () => void;
}

const ModeContext = createContext<ModeValue | null>(null);

export interface ModeProviderProps {
  children: ReactNode;
  /** The mode to start in. */
  initialMode?: Mode;
  /** Called whenever the mode changes, so you can save it. */
  onModeChange?: (mode: Mode) => void;
}

/**
 * Holds the light, dark or system choice for the whole app. Read it anywhere below with `useMode()`.
 * "system" follows the device and updates when the device changes. The provider keeps the choice in
 * memory only; save it from `onModeChange` and pass it back as `initialMode` to remember it.
 */
export function ModeProvider({
  children,
  initialMode = "system",
  onModeChange,
}: ModeProviderProps) {
  const system = useSystemScheme();
  const [mode, setModeState] = useState<Mode>(initialMode);
  const scheme = mode === "system" ? system : mode;

  const setMode = useCallback(
    (next: Mode) => {
      setModeState(next);
      onModeChange?.(next);
    },
    [onModeChange],
  );
  const toggle = useCallback(
    () => setMode(scheme === "dark" ? "light" : "dark"),
    [scheme, setMode],
  );

  const value = useMemo(() => ({ mode, scheme, setMode, toggle }), [mode, scheme, setMode, toggle]);
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

/** The current mode and scheme. Throws when used outside a ModeProvider, so a missing one is caught early. */
export function useMode(): ModeValue {
  const value = useContext(ModeContext);
  if (!value) throw new Error("useMode must be used inside a ModeProvider");
  return value;
}
