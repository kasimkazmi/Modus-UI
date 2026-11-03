import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const THUMB = 28;

export interface StepSliderColors {
  track: string;
  fill: string;
  thumb: string;
  text: string;
}

const DEFAULT_COLORS: StepSliderColors = {
  track: "#e5e7eb",
  fill: "#4f46e5",
  thumb: "#ffffff",
  text: "#6b7280",
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

export interface StepSliderProps {
  /** The label under each stop. */
  steps: string[];
  /** The index of the chosen stop. */
  value: number;
  onChange: (index: number) => void;
  /** Spoken name of the slider. */
  label?: string;
  colors?: Partial<StepSliderColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A slider with a fixed set of stops, such as a text size or a delivery speed. The thumb follows the
 * finger and settles on the nearest stop with a spring; tapping the track jumps to the stop under it.
 * It is an adjustable control for screen readers and reads out the label of the chosen stop.
 */
export function StepSlider({
  steps,
  value,
  onChange,
  label = "Step",
  colors,
  style,
}: StepSliderProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const dragging = useRef(false);
  const last = steps.length - 1;
  const travel = Math.max(1, width - THUMB);

  const live = useRef({ travel, last, value, onChange, reduceMotion });
  live.current = { travel, last, value, onChange, reduceMotion };

  const settle = (index: number) => {
    const target = (index / Math.max(1, live.current.last)) * live.current.travel;
    if (live.current.reduceMotion) x.setValue(target);
    else
      Animated.spring(x, {
        toValue: target,
        stiffness: 420,
        damping: 30,
        mass: 1,
        useNativeDriver: false,
      }).start();
  };

  useEffect(() => {
    if (!dragging.current && width > 0) settle(value);
    // settle reads everything through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, width, reduceMotion]);

  const indexAt = (px: number) => {
    const { travel: t, last: l } = live.current;
    return Math.max(0, Math.min(l, Math.round(((px - THUMB / 2) / t) * l)));
  };

  const start = useRef(0);
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        dragging.current = true;
        const px = Math.max(
          0,
          Math.min(live.current.travel, event.nativeEvent.locationX - THUMB / 2),
        );
        start.current = px;
        x.stopAnimation();
        x.setValue(px);
        const next = indexAt(event.nativeEvent.locationX);
        if (next !== live.current.value) live.current.onChange(next);
      },
      onPanResponderMove: (_, g) => {
        const px = Math.max(0, Math.min(live.current.travel, start.current + g.dx));
        x.setValue(px);
        const next = indexAt(px + THUMB / 2);
        if (next !== live.current.value) live.current.onChange(next);
      },
      onPanResponderRelease: () => {
        dragging.current = false;
        settle(live.current.value);
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        settle(live.current.value);
      },
    }),
  ).current;

  const move = (direction: 1 | -1) => onChange(Math.max(0, Math.min(last, value + direction)));

  return (
    <View style={style}>
      <View
        {...responder.panHandlers}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        aria-label={label}
        accessibilityValue={{ min: 0, max: last, now: value, text: steps[value] }}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={value}
        aria-valuetext={steps[value]}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) =>
          move(event.nativeEvent.actionName === "increment" ? 1 : -1)
        }
        style={styles.hit}
      >
        <View style={[styles.track, { backgroundColor: palette.track }]} />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fill,
            { backgroundColor: palette.fill, width: Animated.add(x, THUMB / 2) },
          ]}
        />
        {steps.map((step, i) => (
          <View
            key={step}
            pointerEvents="none"
            style={[
              styles.tick,
              {
                left: THUMB / 2 - 3 + (i / Math.max(1, last)) * travel,
                backgroundColor: i <= value ? palette.thumb : palette.fill,
              },
            ]}
          />
        ))}
        <Animated.View
          pointerEvents="none"
          style={[styles.thumb, { backgroundColor: palette.thumb, transform: [{ translateX: x }] }]}
        />
      </View>
      <View style={styles.labels} pointerEvents="none">
        {steps.map((step, i) => (
          <Text
            key={step}
            style={[
              styles.label,
              {
                color: i === value ? palette.fill : palette.text,
                fontWeight: i === value ? "700" : "500",
              },
            ]}
          >
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 44, justifyContent: "center", userSelect: "none" },
  track: { height: 6, borderRadius: 3 },
  fill: { position: "absolute", left: 0, top: 19, height: 6, borderRadius: 3 },
  tick: { position: "absolute", top: 19, width: 6, height: 6, borderRadius: 3 },
  thumb: {
    position: "absolute",
    left: 0,
    top: 8,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
  },
  labels: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 12 },
});
