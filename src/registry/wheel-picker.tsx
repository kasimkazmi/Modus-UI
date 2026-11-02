import { useEffect, useMemo, useRef, useState, type ElementRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
// How long the scroll must be still before a mouse wheel counts as settled.
const SETTLE_MS = 140;

export interface WheelPickerOption {
  value: string;
  label: string;
}

export interface WheelPickerColors {
  text: string;
  selectedText: string;
  highlight: string;
}

const DEFAULT_COLORS: WheelPickerColors = {
  text: "#6b7280",
  selectedText: "#111827",
  highlight: "#f3f4f6",
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

export interface WheelPickerProps {
  options: WheelPickerOption[];
  /** The selected option's `value`. */
  value: string;
  /** Called once the wheel settles on a different option, not on every frame of the scroll. */
  onChange: (value: string) => void;
  /** Height of one row. */
  itemHeight?: number;
  /** How many rows are visible. Use an odd number so one row sits in the middle. */
  visibleCount?: number;
  /** Spoken name of the wheel, for example "Hour". */
  label?: string;
  colors?: Partial<WheelPickerColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * An iOS-style scrolling wheel. Rows snap to the middle, shrink and fade with their distance from it,
 * and `onChange` fires when the wheel comes to rest, including when a mouse wheel stops. A tap on a
 * row brings it to the middle, and screen readers can step through the options.
 */
export function WheelPicker({
  options,
  value,
  onChange,
  itemHeight = 40,
  visibleCount = 5,
  label = "Picker",
  colors,
  style,
}: WheelPickerProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const scroll = useRef<ElementRef<typeof ScrollView>>(null);
  const y = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  // The option the wheel last settled on, so a settle that changes nothing stays quiet.
  const settled = useRef(index);
  const rows = Math.max(1, visibleCount);
  const pad = Math.floor(rows / 2) * itemHeight;

  const live = useRef({ options, itemHeight, reduceMotion, onChange });
  live.current = { options, itemHeight, reduceMotion, onChange };

  const scrollToIndex = (target: number, animated = !live.current.reduceMotion) => {
    scroll.current?.scrollTo({ y: target * live.current.itemHeight, animated });
  };

  const settle = () => {
    const { options: list, itemHeight: h } = live.current;
    const next = Math.max(0, Math.min(list.length - 1, Math.round(offset.current / h)));
    // On the web a wheel can stop between rows, so finish the snap by hand.
    if (Math.abs(offset.current - next * h) > 1) scrollToIndex(next);
    if (next !== settled.current) {
      settled.current = next;
      live.current.onChange(list[next].value);
    }
  };

  const queueSettle = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(settle, SETTLE_MS);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Start on the selected row, and follow `value` when it changes from outside.
  useEffect(() => {
    if (index === settled.current && Math.abs(offset.current - index * itemHeight) < 2) return;
    settled.current = index;
    scrollToIndex(index, offset.current !== 0);
    // scrollToIndex reads everything through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, itemHeight]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.y;
    queueSettle();
  };

  const step = (direction: 1 | -1) => {
    const next = Math.max(0, Math.min(options.length - 1, index + direction));
    if (next === index) return;
    settled.current = next;
    scrollToIndex(next);
    onChange(options[next].value);
  };

  const rowStyles = useMemo(
    () =>
      options.map((_, i) => {
        const at = (n: number) => (i + n) * itemHeight;
        const range = [at(-2), at(-1), at(0), at(1), at(2)];
        return {
          opacity: y.interpolate({
            inputRange: range,
            outputRange: [0.25, 0.5, 1, 0.5, 0.25],
            extrapolate: "clamp",
          }),
          scale: reduceMotion
            ? 1
            : y.interpolate({
                inputRange: range,
                outputRange: [0.8, 0.9, 1, 0.9, 0.8],
                extrapolate: "clamp",
              }),
          // The selected colour fades in over the plain one as a row nears the middle.
          selected: y.interpolate({
            inputRange: [at(-1), at(0), at(1)],
            outputRange: [0, 1, 0],
            extrapolate: "clamp",
          }),
        };
      }),
    [options, itemHeight, y, reduceMotion],
  );

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      aria-label={label}
      accessibilityValue={{ text: options[index]?.label }}
      aria-valuetext={options[index]?.label}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => step(event.nativeEvent.actionName === "increment" ? 1 : -1)}
      style={[styles.root, { height: itemHeight * rows }, style]}
    >
      <View
        pointerEvents="none"
        style={[styles.band, { top: pad, height: itemHeight, backgroundColor: palette.highlight }]}
      />
      <Animated.ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: pad }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], {
          useNativeDriver: NATIVE_DRIVER,
          listener: onScroll,
        })}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={queueSettle}
      >
        {options.map((option, i) => (
          <Pressable
            key={option.value}
            accessible={false}
            aria-hidden
            onPress={() => {
              scrollToIndex(i);
              offset.current = i * itemHeight;
              queueSettle();
            }}
            style={{ height: itemHeight, justifyContent: "center", alignItems: "center" }}
          >
            <Animated.View
              style={{
                opacity: rowStyles[i].opacity,
                transform: [{ scale: rowStyles[i].scale }],
              }}
            >
              <Animated.Text style={[styles.label, { color: palette.text }]}>
                {option.label}
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.label,
                  styles.over,
                  { color: palette.selectedText, opacity: rowStyles[i].selected },
                ]}
              >
                {option.label}
              </Animated.Text>
            </Animated.View>
          </Pressable>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: "hidden", userSelect: "none" },
  band: { position: "absolute", left: 0, right: 0, borderRadius: 10 },
  label: { fontSize: 20, fontWeight: "600", textAlign: "center" },
  over: { position: "absolute", left: 0, right: 0, top: 0 },
});
