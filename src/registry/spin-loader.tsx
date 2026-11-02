import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export type SpinVariant = "ring" | "dots" | "bars" | "pulse";

export interface SpinLoaderColors {
  color: string;
  track: string;
}

const DEFAULT_COLORS: SpinLoaderColors = {
  color: "#4f46e5",
  track: "rgba(128, 128, 128, 0.25)",
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

export interface SpinLoaderProps {
  /** Which style of spinner to draw. */
  variant?: SpinVariant;
  /** Height and width of the spinner. */
  size?: number;
  /** Milliseconds for one full cycle. */
  duration?: number;
  /** Spoken name of the spinner. */
  label?: string;
  colors?: Partial<SpinLoaderColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * Four loading spinners in one component: a turning ring, three bouncing dots, a row of rising bars,
 * and a pulse that spreads outward. They share one loop, mount their views once so the animation
 * never restarts, and stand still when motion is reduced. Each reads out as a busy progress bar.
 */
export function SpinLoader({
  variant = "ring",
  size = 32,
  duration = 900,
  label = "Loading",
  colors,
  style,
}: SpinLoaderProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      t.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration,
        easing: variant === "ring" ? Easing.linear : Easing.inOut(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, duration, variant, t]);

  // Offsets that stagger the dots and bars across the cycle.
  const phase = useMemo(() => (i: number) => i * 0.14, []);

  const body = (() => {
    if (variant === "ring") {
      return (
        <Animated.View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: Math.max(2, size / 9),
            borderColor: palette.track,
            borderTopColor: palette.color,
            transform: [
              { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) },
            ],
          }}
        />
      );
    }
    if (variant === "dots") {
      const dot = size / 4;
      return (
        <View style={[styles.row, { width: size, height: size, gap: dot * 0.6 }]}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={{
                width: dot,
                height: dot,
                borderRadius: dot / 2,
                backgroundColor: palette.color,
                opacity: t.interpolate({
                  inputRange: [0, phase(i), phase(i) + 0.2, phase(i) + 0.4, 1],
                  outputRange: [0.3, 0.3, 1, 0.3, 0.3],
                }),
                transform: [
                  {
                    translateY: t.interpolate({
                      inputRange: [0, phase(i), phase(i) + 0.2, phase(i) + 0.4, 1],
                      outputRange: [0, 0, -dot * 0.7, 0, 0],
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>
      );
    }
    if (variant === "bars") {
      const bar = size / 7;
      return (
        <View
          style={[styles.row, { width: size, height: size, gap: bar * 0.7, alignItems: "center" }]}
        >
          {[0, 1, 2, 3].map((i) => (
            <Animated.View
              key={i}
              style={{
                width: bar,
                height: size * 0.8,
                borderRadius: bar / 2,
                backgroundColor: palette.color,
                transform: [
                  {
                    scaleY: t.interpolate({
                      inputRange: [0, phase(i), phase(i) + 0.25, phase(i) + 0.5, 1],
                      outputRange: [0.3, 0.3, 1, 0.3, 0.3],
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>
      );
    }
    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: palette.color,
            opacity: reduceMotion
              ? 0.25
              : t.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
            transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
          }}
        />
        <View
          style={{
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: size * 0.15,
            backgroundColor: palette.color,
          }}
        />
      </View>
    );
  })();

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      aria-label={label}
      aria-busy
      accessibilityState={{ busy: true }}
      style={[{ width: size, height: size }, style]}
    >
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center" },
});
