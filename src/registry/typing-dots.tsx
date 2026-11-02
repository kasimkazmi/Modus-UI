import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
// Share of one cycle each dot spends bouncing; the rest of the cycle it rests.
const BOUNCE_WINDOW = 0.4;
const REST_OPACITY = 0.5;

export interface TypingDotsColors {
  dot: string;
  bubble: string;
}

const DEFAULT_COLORS: TypingDotsColors = {
  dot: "#6b7280",
  bubble: "#e5e7eb",
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

export interface TypingDotsProps {
  /** Diameter of each dot. */
  size?: number;
  /** How many dots. */
  count?: number;
  /** Draw the rounded chat bubble behind the dots. */
  bubble?: boolean;
  /** Length of one full wave, in milliseconds. */
  speed?: number;
  /** Spoken label. The dots themselves are hidden from screen readers. */
  label?: string;
  colors?: Partial<TypingDotsColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * The three bouncing dots of a chat typing indicator. A wave runs through the dots, each lifting
 * and brightening in turn. With reduced motion they sit still at a medium brightness. Screen
 * readers hear one element with the label, not the dots.
 */
export function TypingDots({
  size = 8,
  count = 3,
  bubble = true,
  speed = 1200,
  label = "Typing",
  colors,
  style,
}: TypingDotsProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  // One value drives every dot, so the wave can never drift out of step.
  const cycle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      // Past every dot's window: all of them at rest.
      cycle.setValue(1);
      return;
    }
    cycle.setValue(0);
    const loop = Animated.loop(
      Animated.timing(cycle, {
        toValue: 1,
        duration: speed,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, speed, cycle]);

  // The interpolations are built once per size and count. Rebuilding them on every render makes
  // react-native-web drop the running animation.
  const motion = useMemo(() => {
    const step = (1 - BOUNCE_WINDOW) / Math.max(1, count);
    return Array.from({ length: count }, (_, i) => {
      const start = i * step;
      const inputRange = [0, start, start + BOUNCE_WINDOW / 2, start + BOUNCE_WINDOW, 1];
      return {
        translateY: cycle.interpolate({
          inputRange,
          outputRange: [0, 0, -size * 0.9, 0, 0],
        }),
        opacity: cycle.interpolate({
          inputRange,
          outputRange: [REST_OPACITY, REST_OPACITY, 1, REST_OPACITY, REST_OPACITY],
        }),
      };
    });
  }, [cycle, count, size]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      aria-label={label}
      aria-busy
      style={[
        bubble && {
          alignSelf: "flex-start",
          paddingHorizontal: size * 1.5,
          paddingVertical: size * 1.2,
          borderRadius: size * 1.8,
          backgroundColor: palette.bubble,
        },
        style,
      ]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden
        style={{ flexDirection: "row", alignItems: "center", gap: size * 0.7, height: size }}
      >
        {motion.map((dot, i) => (
          <Animated.View
            key={`dot-${i}`}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: palette.dot,
              opacity: dot.opacity,
              transform: [{ translateY: dot.translateY }],
            }}
          />
        ))}
      </View>
    </View>
  );
}
