import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
// The indeterminate segment is this fraction of the track.
const SEGMENT = 0.4;
// Horizontal distance between two stripes.
const MIN_PERIOD = 16;

export interface StripeProgressColors {
  track: string;
  fill: string;
  stripe: string;
  text: string;
}

const DEFAULT_COLORS: StripeProgressColors = {
  track: "#e5e7eb",
  fill: "#4f46e5",
  stripe: "rgba(255, 255, 255, 0.3)",
  text: "#374151",
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

export interface StripeProgressProps {
  /** Progress from 0 to 1. Leave it out for an indeterminate bar. */
  value?: number;
  /** Height of the bar. */
  height?: number;
  /** Draws diagonal stripes on the fill. */
  striped?: boolean;
  /** Lets the stripes drift while the bar is determinate. */
  animated?: boolean;
  /** Spoken name of the bar. */
  label?: string;
  /** Shows the percentage next to the bar. */
  showPercent?: boolean;
  colors?: Partial<StripeProgressColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A progress bar whose fill grows with a spring and whose diagonal stripes drift along it. Leave
 * `value` out and a segment travels across the track instead. Stripes are plain rotated views, so it
 * needs no gradient or SVG package. With reduced motion nothing drifts or travels, but the fill still
 * follows the value.
 */
export function StripeProgress({
  value,
  height = 10,
  striped = true,
  animated = true,
  label = "Progress",
  showPercent = false,
  colors,
  style,
}: StripeProgressProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const indeterminate = value === undefined;
  const clamped = Math.max(0, Math.min(1, value ?? 0));
  const percent = Math.round(clamped * 100);

  const fill = useRef(new Animated.Value(clamped)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const travel = useRef(new Animated.Value(0)).current;

  const period = Math.max(MIN_PERIOD, height * 2);
  const stripeCount = width > 0 ? Math.ceil(width / period) + 3 : 0;
  const moving = !reduceMotion;

  // The fill follows the value.
  useEffect(() => {
    if (indeterminate) return;
    if (reduceMotion) {
      fill.setValue(clamped);
      return;
    }
    Animated.timing(fill, {
      toValue: clamped,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, indeterminate, reduceMotion, fill]);

  // Both loops start once the width is known, on views that are mounted from the start.
  useEffect(() => {
    if (width <= 0 || !moving) return;
    const loops: Animated.CompositeAnimation[] = [];
    if (striped && animated && !indeterminate) {
      drift.setValue(0);
      loops.push(
        Animated.loop(
          Animated.timing(drift, {
            toValue: period,
            duration: 900,
            easing: Easing.linear,
            useNativeDriver: NATIVE_DRIVER,
          }),
        ),
      );
    }
    if (indeterminate) {
      travel.setValue(0);
      loops.push(
        Animated.loop(
          Animated.timing(travel, {
            toValue: 1,
            duration: 1300,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: NATIVE_DRIVER,
          }),
        ),
      );
    }
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [width, moving, striped, animated, indeterminate, period, drift, travel]);

  const fillWidth = useMemo(
    () => fill.interpolate({ inputRange: [0, 1], outputRange: [0, width], extrapolate: "clamp" }),
    [fill, width],
  );
  const segmentWidth = width * SEGMENT;
  const segmentX = useMemo(
    () => travel.interpolate({ inputRange: [0, 1], outputRange: [-segmentWidth, width] }),
    [travel, width, segmentWidth],
  );
  const stripeList = useMemo(() => Array.from({ length: stripeCount }, (_, i) => i), [stripeCount]);

  return (
    <View style={[styles.row, style]}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        aria-label={label}
        accessibilityValue={
          indeterminate ? { text: "In progress" } : { min: 0, max: 100, now: percent }
        }
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : percent}
        aria-valuetext={indeterminate ? "In progress" : `${percent} percent`}
        aria-busy={indeterminate}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        style={[styles.track, { height, borderRadius: height / 2, backgroundColor: palette.track }]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: fillWidth,
              backgroundColor: palette.fill,
              borderRadius: height / 2,
              opacity: indeterminate ? 0 : 1,
            },
          ]}
        >
          {striped ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.stripes,
                {
                  left: -period * 2,
                  width: stripeCount * period,
                  transform: [{ translateX: drift }],
                },
              ]}
            >
              {stripeList.map((i) => (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    top: -height,
                    left: i * period,
                    width: period * 0.36,
                    height: height * 3,
                    backgroundColor: palette.stripe,
                    transform: [{ rotate: "45deg" }],
                  }}
                />
              ))}
            </Animated.View>
          ) : null}
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.segment,
            {
              width: segmentWidth,
              backgroundColor: palette.fill,
              borderRadius: height / 2,
              opacity: indeterminate ? 1 : 0,
              transform: [{ translateX: moving ? segmentX : (width - segmentWidth) / 2 }],
            },
          ]}
        />
      </View>
      {showPercent ? (
        <Text style={[styles.percent, { color: palette.text }]}>
          {indeterminate ? "" : `${percent}%`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  track: { flex: 1, overflow: "hidden" },
  fill: { position: "absolute", top: 0, bottom: 0, left: 0, overflow: "hidden" },
  stripes: { position: "absolute", top: 0, bottom: 0 },
  segment: { position: "absolute", top: 0, bottom: 0, left: 0 },
  percent: { minWidth: 40, textAlign: "right", fontSize: 13, fontWeight: "600" },
});
