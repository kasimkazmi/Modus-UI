import { useEffect, useRef, useState, type ReactNode } from "react";
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

export interface RingMeterColors {
  track: string;
  fill: string;
  text: string;
}

const DEFAULT_COLORS: RingMeterColors = {
  track: "#e5e7eb",
  fill: "#4f46e5",
  text: "#111827",
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

export interface RingMeterProps {
  /** Progress from 0 to 1. */
  value: number;
  /** Diameter of the ring. */
  size?: number;
  /** Width of the ring's stroke. */
  thickness?: number;
  /** Shows the percentage in the middle when there are no children. */
  showValue?: boolean;
  /** Animates the ring to each new value. */
  animated?: boolean;
  /** Spoken name of the meter. */
  label?: string;
  /** Replaces the percentage in the middle. */
  children?: ReactNode;
  colors?: Partial<RingMeterColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A circular progress ring built from plain views, with no SVG package. Two half rings, each a
 * bordered circle clipped to one side, are turned by the same value: the right half sweeps first,
 * then the left takes over, so the arc grows smoothly all the way round.
 */
export function RingMeter({
  value,
  size = 120,
  thickness = 10,
  showValue = true,
  animated = true,
  label = "Progress",
  children,
  colors,
  style,
}: RingMeterProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const clamped = Math.max(0, Math.min(1, value));
  const percent = Math.round(clamped * 100);
  const p = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    if (!animated || reduceMotion) {
      p.setValue(clamped);
      return;
    }
    Animated.timing(p, {
      toValue: clamped,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [clamped, animated, reduceMotion, p]);

  // A circle whose top and right borders are coloured shows a half ring. Turned by -135 degrees it
  // lies in the left half and is clipped away; turned by +45 it fills the right half exactly.
  const right = p.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["-135deg", "45deg", "45deg"],
  });
  const left = p.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["45deg", "45deg", "225deg"],
  });

  const half = size / 2;
  const arc = {
    position: "absolute" as const,
    top: 0,
    width: size,
    height: size,
    borderRadius: half,
    borderWidth: thickness,
    borderColor: "transparent",
    borderTopColor: palette.fill,
    borderRightColor: palette.fill,
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
      aria-valuetext={`${percent} percent`}
      style={[{ width: size, height: size }, style]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: thickness,
          borderColor: palette.track,
        }}
      />
      <View style={[styles.clip, { left: half, width: half, height: size }]}>
        <Animated.View style={[arc, { left: -half, transform: [{ rotate: right }] }]} />
      </View>
      <View style={[styles.clip, { left: 0, width: half, height: size }]}>
        <Animated.View style={[arc, { left: 0, transform: [{ rotate: left }] }]} />
      </View>
      <View pointerEvents="none" style={styles.center}>
        {children ??
          (showValue ? (
            <Text style={[styles.value, { color: palette.text, fontSize: size * 0.24 }]}>
              {percent}%
            </Text>
          ) : null)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { position: "absolute", top: 0, overflow: "hidden" },
  center: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontWeight: "800" },
});
