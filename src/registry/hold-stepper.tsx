import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
// The value slides this far in from the direction it moved.
const SLIDE = 14;
// Repeat speed: start slow, end fast.
const SLOW_MS = 120;
const FAST_MS = 40;

export interface HoldStepperColors {
  button: string;
  glyph: string;
  text: string;
}

const DEFAULT_COLORS: HoldStepperColors = {
  button: "#f3f4f6",
  glyph: "#111827",
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

export interface HoldStepperProps {
  value: number;
  onChange: (next: number) => void;
  /** The lowest value. The minus button dims and stops here. */
  min?: number;
  /** The highest value. The plus button dims and stops here. */
  max?: number;
  /** How much one tap, or one repeat, changes the value. */
  step?: number;
  /** Milliseconds a button must be held before it starts repeating. */
  holdDelay?: number;
  /** What the value counts, for example "Guests". Spoken with the buttons and the group. */
  label?: string;
  colors?: Partial<HoldStepperColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A plus and minus stepper. A tap changes the value by one step. Holding a button repeats, slowly
 * at first and then faster, and stops the moment the button is released, the pointer leaves or the
 * limit is reached. The value slides in from the direction it moved. Both buttons are 44pt, the
 * pair reads as one adjustable control to screen readers, and reduced motion drops the slide.
 */
export function HoldStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  holdDelay = 400,
  label,
  colors,
  style,
}: HoldStepperProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const previous = useRef(value);

  // The press handlers outlive a render, so they read what they need from here.
  const live = useRef({ value, min, max, step, holdDelay, onChange });
  live.current = { value, min, max, step, holdDelay, onChange };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // Slide the new value in from the side it came from.
  useEffect(() => {
    const direction = Math.sign(value - previous.current);
    previous.current = value;
    if (direction === 0 || reduceMotion) return;
    slide.setValue(direction * SLIDE);
    fade.setValue(0);
    Animated.parallel([
      Animated.spring(slide, {
        toValue: 0,
        stiffness: 420,
        damping: 28,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.timing(fade, { toValue: 1, duration: 140, useNativeDriver: NATIVE_DRIVER }),
    ]).start();
  }, [value, reduceMotion, slide, fade]);

  useEffect(() => stop, []);

  /** Moves one step. Returns false when already at the limit. */
  const move = (direction: 1 | -1) => {
    const { value: current, min: low, max: high, step: size, onChange: change } = live.current;
    const next = Math.min(high, Math.max(low, current + direction * size));
    if (next === current) return false;
    // Updated now so a fast repeat does not read the value from before the parent re-rendered.
    live.current.value = next;
    change(next);
    return true;
  };

  const begin = (direction: 1 | -1) => {
    stop();
    if (!move(direction)) return;
    const startedAt = Date.now();
    const tick = () => {
      if (!move(direction)) {
        stop();
        return;
      }
      const held = Math.max(0, Date.now() - startedAt - live.current.holdDelay);
      const delay = Math.max(FAST_MS, SLOW_MS - held * ((SLOW_MS - FAST_MS) / 1000));
      timer.current = setTimeout(tick, delay);
    };
    timer.current = setTimeout(tick, live.current.holdDelay);
  };

  const atMin = value <= min;
  const atMax = value >= max;
  const noun = label ? ` ${label}` : "";

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label ?? "Value"}
      accessibilityValue={{ min, max, now: value }}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={String(value)}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "increment") move(1);
        else if (event.nativeEvent.actionName === "decrement") move(-1);
      }}
      style={[styles.row, style]}
    >
      <StepButton
        glyph="minus"
        label={`Decrease${noun}`}
        disabled={atMin}
        palette={palette}
        reduceMotion={reduceMotion}
        onPressIn={() => begin(-1)}
        onRelease={stop}
      />
      <View style={styles.valueBox}>
        <Animated.Text
          style={[
            styles.value,
            { color: palette.text, opacity: fade, transform: [{ translateY: slide }] },
          ]}
        >
          {value}
        </Animated.Text>
      </View>
      <StepButton
        glyph="plus"
        label={`Increase${noun}`}
        disabled={atMax}
        palette={palette}
        reduceMotion={reduceMotion}
        onPressIn={() => begin(1)}
        onRelease={stop}
      />
    </View>
  );
}

interface StepButtonProps {
  glyph: "plus" | "minus";
  label: string;
  disabled: boolean;
  palette: HoldStepperColors;
  reduceMotion: boolean;
  onPressIn: () => void;
  onRelease: () => void;
}

function StepButton({
  glyph,
  label,
  disabled,
  palette,
  reduceMotion,
  onPressIn,
  onRelease,
}: StepButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  // A press that began this render's gesture, so a keyboard click is not counted twice.
  const stepped = useRef(false);

  const scaleTo = (toValue: number) => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue,
      stiffness: 520,
      damping: 28,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.35 : 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        aria-label={label}
        accessibilityState={{ disabled }}
        aria-disabled={disabled}
        disabled={disabled}
        onPressIn={() => {
          stepped.current = true;
          scaleTo(0.9);
          onPressIn();
        }}
        onPress={() => {
          // Pointer and touch presses already stepped in onPressIn; this covers a keyboard click.
          if (!stepped.current) onPressIn();
          stepped.current = false;
        }}
        onPressOut={() => {
          scaleTo(1);
          onRelease();
        }}
        onBlur={onRelease}
        style={[styles.button, { backgroundColor: palette.button }]}
      >
        <View style={[styles.bar, { backgroundColor: palette.glyph }]} />
        {glyph === "plus" ? (
          <View style={[styles.bar, styles.barUp, { backgroundColor: palette.glyph }]} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  // userSelect keeps a mouse hold on the web from selecting text instead of repeating.
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
  },
  bar: { position: "absolute", width: 16, height: 2.5, borderRadius: 2 },
  barUp: { transform: [{ rotate: "90deg" }] },
  valueBox: {
    minWidth: 56,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  value: { fontSize: 24, fontWeight: "700", fontVariant: ["tabular-nums"] },
});
