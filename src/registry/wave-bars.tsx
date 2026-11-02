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

export interface WaveBarsColors {
  bar: string;
  played: string;
}

const DEFAULT_COLORS: WaveBarsColors = {
  bar: "#c7d2fe",
  played: "#4f46e5",
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

export interface WaveBarsProps {
  /** Makes the bars dance. */
  playing?: boolean;
  /** How many bars to draw. */
  count?: number;
  /** Height of the tallest bar. */
  height?: number;
  /** Colours the bars up to this fraction, from 0 to 1, as already played. */
  progress?: number;
  /** Spoken name of the waveform. */
  label?: string;
  colors?: Partial<WaveBarsColors>;
  style?: StyleProp<ViewStyle>;
}

// A fixed, repeatable shape so the bars look like a recording rather than noise.
const shape = (i: number) => 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6));

/**
 * A row of bars drawn like an audio waveform. At rest they keep their recorded shape. While
 * `playing` each bar swells and settles out of step with its neighbours, and `progress` tints the
 * bars already played. With reduced motion the bars hold still.
 */
export function WaveBars({
  playing = false,
  count = 24,
  height = 40,
  progress = 0,
  label = "Waveform",
  colors,
  style,
}: WaveBarsProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const t = useRef(new Animated.Value(0)).current;
  const items = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  useEffect(() => {
    if (!playing || reduceMotion) {
      t.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [playing, reduceMotion, t]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      aria-label={label}
      style={[styles.row, { height }, style]}
    >
      {items.map((i) => {
        const base = shape(i);
        const start = (i % 6) / 6;
        const scale = t.interpolate({
          inputRange: [0, start, Math.min(1, start + 0.3), 1],
          outputRange: [1, 1, 0.45, 1],
          extrapolate: "clamp",
        });
        return (
          <Animated.View
            key={i}
            style={{
              flex: 1,
              height: height * base,
              borderRadius: 3,
              backgroundColor: i / count < progress ? palette.played : palette.bar,
              transform: [{ scaleY: scale }],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 3 },
});
