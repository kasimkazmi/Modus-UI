import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export type LiveStatus = "live" | "online" | "away" | "busy" | "offline";

export interface LiveDotColors {
  live: string;
  online: string;
  away: string;
  busy: string;
  offline: string;
  text: string;
}

const DEFAULT_COLORS: LiveDotColors = {
  live: "#ef4444",
  online: "#22c55e",
  away: "#f59e0b",
  busy: "#dc2626",
  offline: "#9ca3af",
  text: "#111827",
};

const WORDS: Record<LiveStatus, string> = {
  live: "Live",
  online: "Online",
  away: "Away",
  busy: "Busy",
  offline: "Offline",
};

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

export interface LiveDotProps {
  status: LiveStatus;
  /** Diameter of the dot. */
  size?: number;
  /** Sends a soft ring outward from the dot while it is live or online. */
  pulse?: boolean;
  /** Shows the status word beside the dot. */
  showLabel?: boolean;
  /** Replaces the status word, for example "Recording". */
  label?: string;
  colors?: Partial<LiveDotColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A presence or broadcast indicator. A live or online dot sends a soft ring outward on a loop, and
 * the colour change between statuses blends. Away, busy and offline stay still. The status is read
 * out, so it never relies on colour alone.
 */
export function LiveDot({
  status,
  size = 10,
  pulse = true,
  showLabel = false,
  label,
  colors,
  style,
}: LiveDotProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const ring = useRef(new Animated.Value(0)).current;
  const active = pulse && !reduceMotion && (status === "live" || status === "online");
  const word = label ?? WORDS[status];

  useEffect(() => {
    if (!active) {
      ring.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: status === "live" ? 1100 : 1900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, status, ring]);

  const color = palette[status];
  const spread = size * 2.6;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={word}
      aria-label={word}
      style={[styles.row, style]}
    >
      <View style={{ width: size, height: size }}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              // Always mounted, so the loop is never rebuilt; it is simply invisible when idle.
              opacity: active
                ? ring.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] })
                : 0,
              transform: [
                {
                  scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, spread / size] }),
                },
              ],
            },
          ]}
        />
        <View
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
        />
      </View>
      {showLabel ? (
        <Text style={[styles.label, { color: status === "live" ? palette.live : palette.text }]}>
          {status === "live" ? word.toUpperCase() : word}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  ring: { position: "absolute", top: 0, left: 0 },
  label: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
});
