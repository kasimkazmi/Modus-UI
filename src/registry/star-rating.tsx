import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface StarRatingColors {
  filled: string;
  empty: string;
}

const DEFAULT_COLORS: StarRatingColors = {
  filled: "#f59e0b",
  empty: "#d1d5db",
};

// userSelect keeps a mouse drag on the web from selecting the glyphs instead of scrubbing.
const styles = StyleSheet.create({ row: { alignSelf: "flex-start", userSelect: "none" } });

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

export interface StarRatingProps {
  /** The current rating, from 0 to `max`. */
  value: number;
  /** Called with the new rating whenever a tap or drag changes it. */
  onChange?: (value: number) => void;
  /** How many stars there are. */
  max?: number;
  /** Width and height of each star. */
  size?: number;
  /** Lets the rating land on halves: the left half of a star counts as half. */
  allowHalf?: boolean;
  /** Shows the rating without letting anyone change it. */
  readOnly?: boolean;
  /** Spoken name of the control. */
  label?: string;
  colors?: Partial<StarRatingColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A star rating you can tap or scrub. Drag across the row and the rating follows the pointer,
 * snapping to whole stars (or halves); dragging past the left edge clears it. Each star pops as it
 * fills. Screen readers get an adjustable control that says "3 of 5", and a read-only rating is
 * announced as an image with the same text.
 */
export function StarRating({
  value,
  onChange,
  max = 5,
  size = 34,
  allowHalf = false,
  readOnly = false,
  label = "Rating",
  colors,
  style,
}: StarRatingProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();

  const gap = Math.round(size * 0.12);
  const step = allowHalf ? 0.5 : 1;
  const text = `${value} of ${max}`;

  // The responder is created once, so it reads the latest values from here.
  const live = useRef({ value, onChange, max, size, gap, allowHalf, step });
  live.current = { value, onChange, max, size, gap, allowHalf, step };
  const touch = useRef({ startX: 0, moved: false });

  /** The rating under a horizontal position inside the row. */
  const valueAt = (x: number, scrubbing: boolean) => {
    const { max: count, size: width, gap: space, allowHalf: halves } = live.current;
    if (scrubbing && x < 0) return 0;
    const cell = width + space;
    const index = Math.max(0, Math.min(count - 1, Math.floor(x / cell)));
    const into = Math.max(0, Math.min(1, (x - index * cell) / width));
    return halves ? index + (into <= 0.5 ? 0.5 : 1) : index + 1;
  };

  const commit = (next: number) => {
    if (next !== live.current.value) live.current.onChange?.(next);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        touch.current = { startX: event.nativeEvent.locationX, moved: false };
      },
      onPanResponderMove: (_, g) => {
        if (!touch.current.moved && Math.abs(g.dx) < 4) return;
        touch.current.moved = true;
        commit(valueAt(touch.current.startX + g.dx, true));
      },
      // Nothing here is a Pressable, so the click a mouse sends after a drag has nothing to hit.
      onPanResponderRelease: () => {
        if (!touch.current.moved) commit(valueAt(touch.current.startX, false));
      },
    }),
  ).current;

  const nudge = (direction: 1 | -1) => {
    const next = Math.max(0, Math.min(max, value + direction * step));
    if (next !== value) onChange?.(next);
  };

  const rowWidth = max * size + (max - 1) * gap;

  return (
    <View
      {...(readOnly ? {} : pan.panHandlers)}
      accessible
      accessibilityRole={readOnly ? "image" : "adjustable"}
      accessibilityLabel={readOnly ? `${label}: ${text}` : label}
      accessibilityValue={readOnly ? undefined : { min: 0, max, now: value, text }}
      aria-valuemin={readOnly ? undefined : 0}
      aria-valuemax={readOnly ? undefined : max}
      aria-valuenow={readOnly ? undefined : value}
      aria-valuetext={readOnly ? undefined : text}
      accessibilityActions={readOnly ? undefined : [{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) =>
        nudge(event.nativeEvent.actionName === "increment" ? 1 : -1)
      }
      style={[styles.row, { width: rowWidth, height: size }, style]}
    >
      {/* Stars ignore the pointer, so locationX is always measured from the row. */}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ flexDirection: "row", gap }}
      >
        {Array.from({ length: max }, (_, index) => (
          <Star
            key={index}
            fraction={Math.max(0, Math.min(1, value - index))}
            size={size}
            colors={palette}
            reduceMotion={reduceMotion}
          />
        ))}
      </View>
    </View>
  );
}

interface StarProps {
  /** How much of the star is filled, 0 to 1. */
  fraction: number;
  size: number;
  colors: StarRatingColors;
  reduceMotion: boolean;
}

function Star({ fraction, size, colors, reduceMotion }: StarProps) {
  const filled = fraction > 0;
  const scale = useRef(new Animated.Value(1)).current;
  const wasFilled = useRef(filled);
  // Mounted up front and memoized, so react-native-web never rebuilds the animated style.
  const popStyle = useMemo(() => ({ transform: [{ scale }] }), [scale]);

  useEffect(() => {
    if (filled && !wasFilled.current && !reduceMotion) {
      scale.setValue(0.78);
      Animated.spring(scale, {
        toValue: 1,
        stiffness: 520,
        damping: 11,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }).start();
    }
    wasFilled.current = filled;
  }, [filled, reduceMotion, scale]);

  const glyph = {
    position: "absolute",
    top: 0,
    left: 0,
    width: size,
    height: size,
    fontSize: size * 0.9,
    lineHeight: size,
    textAlign: "center",
    includeFontPadding: false,
    userSelect: "none",
  } as const;

  return (
    <Animated.View style={[{ width: size, height: size }, popStyle]}>
      <Text style={[glyph, { color: colors.empty }]}>★</Text>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: fraction * size,
          overflow: "hidden",
        }}
      >
        <Text style={[glyph, { color: colors.filled }]}>★</Text>
      </View>
    </Animated.View>
  );
}
