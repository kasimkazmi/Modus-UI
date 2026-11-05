import { useMemo } from "react";
import { Vibration } from "react-native";

export interface Haptics {
  /** A light tick, for a press or a selection. */
  tap: () => void;
  /** Two short pulses, for something that worked. */
  success: () => void;
  /** Two firmer pulses, for something that needs attention. */
  warning: () => void;
  /** Three pulses, for something that failed. */
  error: () => void;
}

/**
 * Touch feedback built on React Native's Vibration, so it needs no extra package. Pass `enabled`
 * false, for example from a settings switch, and every call does nothing. Android follows the
 * patterns exactly; iOS only offers a single fixed buzz for any pattern, so for finer iOS feedback
 * swap the bodies for expo-haptics.
 */
export function useHaptics(enabled = true): Haptics {
  return useMemo(() => {
    const run = (pattern: number | number[]) => {
      if (enabled) Vibration.vibrate(pattern);
    };
    return {
      tap: () => run(10),
      success: () => run([0, 15, 60, 15]),
      warning: () => run([0, 30, 50, 30]),
      error: () => run([0, 50, 40, 50, 40, 50]),
    };
  }, [enabled]);
}
