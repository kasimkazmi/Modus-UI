import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  type DimensionValue,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const GAP = 10;

// Opacity of each strip across the highlight band: a smooth bell, so the band has soft edges.
const STRIPS = 13;
const BELL = Array.from(
  { length: STRIPS },
  (_, i) => 0.75 * Math.sin((Math.PI * (i + 0.5)) / STRIPS) ** 2,
);

export interface ShimmerBlockColors {
  base: string;
  highlight: string;
}

const DEFAULT_COLORS: ShimmerBlockColors = {
  base: "#e5e7eb",
  highlight: "#ffffff",
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

export interface ShimmerBlockProps {
  /** Width of the block, or of the whole stack when `lines` is more than 1. */
  width?: DimensionValue;
  /** Height of each line. */
  height?: number;
  radius?: number;
  /** How many stacked lines to draw. The last of several is shorter, like the end of a paragraph. */
  lines?: number;
  /** Time for the highlight to cross the block, in milliseconds. */
  duration?: number;
  /** Hide the block from screen readers. Use it for blocks inside a parent that already announces "Loading". */
  decorative?: boolean;
  colors?: Partial<ShimmerBlockColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A loading placeholder with a soft highlight that sweeps across it. The lines of a stack start
 * together and take the same time, so they shimmer in step. Screen readers hear a single "Loading"
 * for the whole block, or
 * nothing when it is `decorative`; with reduced motion the block stays still.
 */
export function ShimmerBlock({
  width = "100%",
  height = 16,
  radius = 8,
  lines = 1,
  duration = 1400,
  decorative = false,
  colors,
  style,
}: ShimmerBlockProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();

  const count = Math.max(1, Math.floor(lines));

  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : "progressbar"}
      accessibilityLabel={decorative ? undefined : "Loading"}
      accessibilityState={decorative ? undefined : { busy: true }}
      aria-hidden={decorative || undefined}
      importantForAccessibility={decorative ? "no-hide-descendants" : "auto"}
      style={[{ width, gap: GAP }, style]}
    >
      {Array.from({ length: count }, (_, i) => (
        <Line
          key={i}
          animated={!reduceMotion}
          duration={duration}
          width={count > 1 && i === count - 1 ? "60%" : "100%"}
          height={height}
          radius={radius}
          colors={palette}
        />
      ))}
    </View>
  );
}

function Line({
  animated,
  duration,
  width,
  height,
  radius,
  colors,
}: {
  animated: boolean;
  duration: number;
  width: DimensionValue;
  height: number;
  radius: number;
  colors: ShimmerBlockColors;
}) {
  const [measured, setMeasured] = useState(0);
  const band = Math.max(96, measured * 0.5);
  // The band is moved by its own value, not an interpolation made during render, and its style is
  // memoized below: react-native-web detaches a value whose animated props are rebuilt, and that
  // stops the animation.
  const translateX = useRef(new Animated.Value(0)).current;

  const bandStyle = useMemo(
    () => [styles.band, { width: band, transform: [{ translateX }] }],
    [band, translateX],
  );

  useEffect(() => {
    if (!animated || measured === 0) return;
    translateX.setValue(-band);
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: measured,
        duration,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, band, duration, measured, translateX]);

  return (
    <View
      aria-hidden
      onLayout={(event: LayoutChangeEvent) => setMeasured(event.nativeEvent.layout.width)}
      style={[styles.line, { width, height, borderRadius: radius, backgroundColor: colors.base }]}
    >
      {animated ? (
        <Animated.View pointerEvents="none" style={bandStyle}>
          {BELL.map((opacity, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: colors.highlight, opacity }} />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { overflow: "hidden" },
  band: { position: "absolute", top: 0, bottom: 0, left: 0, flexDirection: "row" },
});
