import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface PasswordMeterColors {
  track: string;
  weak: string;
  fair: string;
  good: string;
  strong: string;
  text: string;
}

const DEFAULT_COLORS: PasswordMeterColors = {
  track: "#e5e7eb",
  weak: "#dc2626",
  fair: "#f59e0b",
  good: "#84cc16",
  strong: "#16a34a",
  text: "#374151",
};

const NAMES = ["Too short", "Weak", "Fair", "Good", "Strong"];

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/** Scores a password from 0 to 4 on its length and the kinds of characters it mixes. */
export function scorePassword(value: string) {
  if (value.length < 6) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length;
  const length = value.length >= 12 ? 2 : value.length >= 8 ? 1 : 0;
  return Math.max(1, Math.min(4, Math.floor((kinds + length) / 1.5)));
}

export interface PasswordMeterProps {
  /** The password to rate. */
  value: string;
  /** Shows the strength as a word beside the bars. */
  showLabel?: boolean;
  colors?: Partial<PasswordMeterColors>;
  style?: StyleProp<ViewStyle>;
}

function Segment({
  lit,
  color,
  track,
  reduceMotion,
}: {
  lit: boolean;
  color: string;
  track: string;
  reduceMotion: boolean;
}) {
  const fill = useRef(new Animated.Value(lit ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) fill.setValue(lit ? 1 : 0);
    else
      Animated.timing(fill, {
        toValue: lit ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
  }, [lit, reduceMotion, fill]);
  return (
    <View style={[styles.segment, { backgroundColor: track }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          },
        ]}
      />
    </View>
  );
}

/**
 * Four bars that fill and change colour as a password gets stronger, with the verdict beside them.
 * The rating looks at length and how many kinds of character are mixed. It is a hint, not a guarantee,
 * and the verdict is read out whenever it changes.
 */
export function PasswordMeter({ value, showLabel = true, colors, style }: PasswordMeterProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const score = value ? scorePassword(value) : 0;
  const tint = [palette.weak, palette.weak, palette.fair, palette.good, palette.strong][score];
  const name = value ? NAMES[score] : "Enter a password";

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Password strength"
      accessibilityValue={{ min: 0, max: 4, now: score, text: name }}
      aria-label="Password strength"
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuenow={score}
      aria-valuetext={name}
      style={[styles.row, style]}
    >
      <View style={styles.bars}>
        {[1, 2, 3, 4].map((n) => (
          <Segment
            key={n}
            lit={n <= score}
            color={tint}
            track={palette.track}
            reduceMotion={reduceMotion}
          />
        ))}
      </View>
      {showLabel ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.label, { color: value ? tint : palette.text }]}
        >
          {name}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  bars: { flex: 1, flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%" },
  label: { minWidth: 72, fontSize: 13, fontWeight: "700", textAlign: "right" },
});
