import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface GaugeMeterColors {
  track: string;
  fill: string;
  text: string;
  caption: string;
}

const DEFAULT_COLORS: GaugeMeterColors = {
  track: "#e5e7eb",
  fill: "#4f46e5",
  text: "#111827",
  caption: "#6b7280",
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

export interface GaugeMeterProps {
  /** Progress from 0 to 1. */
  value: number;
  /** Width of the gauge; its height is half of this. */
  size?: number;
  /** Width of the arc. */
  thickness?: number;
  /** Text under the number. */
  caption?: string;
  /** Spoken name of the gauge. */
  label?: string;
  colors?: Partial<GaugeMeterColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A half-circle gauge. The arc sweeps round from the left to the value on a spring, with the
 * percentage in the middle and an optional caption below it. The arc is built from clipped, rotated
 * Views, so it needs no SVG package. Reads out as a progress bar.
 */
export function GaugeMeter({
  value,
  size = 220,
  thickness = 18,
  caption,
  label = "Gauge",
  colors,
  style,
}: GaugeMeterProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const clamped = Math.max(0, Math.min(1, value));
  const sweep = useRef(new Animated.Value(clamped)).current;
  const percent = Math.round(clamped * 100);

  useEffect(() => {
    if (reduceMotion) {
      sweep.setValue(clamped);
      return;
    }
    Animated.spring(sweep, {
      toValue: clamped,
      stiffness: 120,
      damping: 18,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [clamped, reduceMotion, sweep]);

  const ring = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: thickness,
  };

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      aria-label={label}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      style={[{ width: size, height: size / 2 + 8 }, style]}
    >
      <View style={{ width: size, height: size / 2, overflow: "hidden" }}>
        <View style={[ring, { borderColor: palette.track }]} />
        <Animated.View
          style={[
            ring,
            {
              borderColor: "transparent",
              borderTopColor: palette.fill,
              borderLeftColor: palette.fill,
              transform: [
                {
                  rotate: sweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["-135deg", "45deg"],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
      <View style={[styles.center, { width: size }]}>
        <Text style={[styles.number, { color: palette.text, fontSize: size * 0.2 }]}>
          {percent}%
        </Text>
        {caption ? (
          <Text style={[styles.caption, { color: palette.caption }]}>{caption}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: "absolute", bottom: 0, alignItems: "center" },
  number: { fontWeight: "800", lineHeight: 44 },
  caption: { fontSize: 13 },
});
