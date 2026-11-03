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

export interface RangeSliderColors {
  track: string;
  fill: string;
  thumb: string;
  bubble: string;
  bubbleText: string;
}

const DEFAULT_COLORS: RangeSliderColors = {
  track: "#e5e7eb",
  fill: "#4f46e5",
  thumb: "#ffffff",
  bubble: "#111827",
  bubbleText: "#ffffff",
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

export interface RangeSliderProps {
  /** The selected range as [low, high]. */
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  /** Called once when a drag ends. */
  onSlidingComplete?: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  /** The least the two thumbs may be apart. */
  minGap?: number;
  /** Floats the thumb's value above it while it is held. */
  showBubbles?: boolean;
  disabled?: boolean;
  /** Spoken name of the range; the thumbs add "minimum" and "maximum". */
  label?: string;
  /** Turns a value into the text shown in the bubble and read out. */
  format?: (value: number) => string;
  colors?: Partial<RangeSliderColors>;
  style?: StyleProp<ViewStyle>;
}

type Which = 0 | 1;

/**
 * A slider with two thumbs for choosing a range, such as a price band. Each thumb drags on its own and
 * can never cross the other, values snap to `step`, and tapping the track moves the nearest thumb.
 * Both thumbs are adjustable controls for screen readers.
 */
export function RangeSlider({
  value,
  onValueChange,
  onSlidingComplete,
  min = 0,
  max = 100,
  step = 1,
  minGap = 0,
  showBubbles = true,
  disabled = false,
  label = "Range",
  format = String,
  colors,
  style,
}: RangeSliderProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<Which | null>(null);
  const [top, setTop] = useState<Which>(1);
  const grow = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  const startValue = useRef(0);

  const live = useRef({
    value,
    min,
    max,
    step,
    minGap,
    width,
    disabled,
    onValueChange,
    onSlidingComplete,
  });
  live.current = {
    value,
    min,
    max,
    step,
    minGap,
    width,
    disabled,
    onValueChange,
    onSlidingComplete,
  };

  const travel = Math.max(1, width - THUMB);
  const toX = (v: number) => ((v - min) / (max - min)) * travel;
  const lowX = toX(value[0]);
  const highX = toX(value[1]);

  const snap = (raw: number) => {
    const { min: lo, max: hi, step: s } = live.current;
    const snapped = Math.round((raw - lo) / s) * s + lo;
    return Math.max(lo, Math.min(hi, Number(snapped.toFixed(6))));
  };

  const setThumb = (which: Which, raw: number) => {
    const { value: current, minGap: gap, min: lo, max: hi } = live.current;
    const next: [number, number] = [current[0], current[1]];
    const snapped = snap(raw);
    next[which] =
      which === 0 ? Math.min(snapped, current[1] - gap) : Math.max(snapped, current[0] + gap);
    next[which] = Math.max(lo, Math.min(hi, next[which]));
    if (next[0] !== current[0] || next[1] !== current[1]) live.current.onValueChange(next);
  };

  const press = (which: Which, down: boolean) => {
    setActive(down ? which : null);
    if (down) setTop(which);
    if (reduceMotion) return;
    Animated.spring(grow[which], {
      toValue: down ? 1 : 0,
      stiffness: 420,
      damping: 24,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  const makeResponder = (which: Which) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => !live.current.disabled,
      onMoveShouldSetPanResponder: () => !live.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startValue.current = live.current.value[which];
        press(which, true);
      },
      onPanResponderMove: (_, g) => {
        const { min: lo, max: hi, width: w } = live.current;
        const perPixel = (hi - lo) / Math.max(1, w - THUMB);
        setThumb(which, startValue.current + g.dx * perPixel);
      },
      onPanResponderRelease: () => {
        press(which, false);
        live.current.onSlidingComplete?.(live.current.value);
      },
      onPanResponderTerminate: () => press(which, false),
    });
  // Responders are created once per thumb and read everything through `live`.
  const responders = useRef([makeResponder(0), makeResponder(1)]).current;

  // Touching the bare track moves whichever thumb is closer to it, and the drag carries on from there.
  const trackWhich = useRef<Which>(0);
  const trackResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !live.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const { value: current, min: lo, max: hi, width: w } = live.current;
        const x = event.nativeEvent.locationX;
        const raw = lo + ((x - THUMB / 2) / Math.max(1, w - THUMB)) * (hi - lo);
        if (!Number.isFinite(raw)) return;
        const which: Which = Math.abs(raw - current[0]) <= Math.abs(raw - current[1]) ? 0 : 1;
        trackWhich.current = which;
        setThumb(which, raw);
        startValue.current = snap(raw);
        press(which, true);
      },
      onPanResponderMove: (_, g) => {
        const { min: lo, max: hi, width: w } = live.current;
        setThumb(
          trackWhich.current,
          startValue.current + g.dx * ((hi - lo) / Math.max(1, w - THUMB)),
        );
      },
      onPanResponderRelease: () => {
        press(trackWhich.current, false);
        live.current.onSlidingComplete?.(live.current.value);
      },
      onPanResponderTerminate: () => press(trackWhich.current, false),
    }),
  ).current;

  const adjust = (which: Which, direction: 1 | -1) =>
    setThumb(which, value[which] + direction * step);

  const thumb = (which: Which) => {
    const x = which === 0 ? lowX : highX;
    const name = which === 0 ? "minimum" : "maximum";
    const text = format(value[which]);
    const scale = grow[which].interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
    return (
      <Animated.View
        key={which}
        {...responders[which].panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${label} ${name}`}
        aria-label={`${label} ${name}`}
        accessibilityValue={{ min, max, now: value[which], text }}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value[which]}
        aria-valuetext={text}
        aria-disabled={disabled}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) =>
          adjust(which, event.nativeEvent.actionName === "increment" ? 1 : -1)
        }
        style={[
          styles.thumb,
          {
            left: x,
            zIndex: top === which ? 2 : 1,
            backgroundColor: palette.thumb,
            transform: [{ scale }],
          },
        ]}
      >
        {showBubbles && active === which ? (
          <View pointerEvents="none" style={styles.bubbleWrap}>
            <View style={[styles.bubble, { backgroundColor: palette.bubble }]}>
              <Text style={[styles.bubbleText, { color: palette.bubbleText }]}>{text}</Text>
            </View>
          </View>
        ) : null}
      </Animated.View>
    );
  };

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.root, disabled && styles.disabled, style]}
    >
      <View {...trackResponder.panHandlers} style={styles.hit}>
        <View style={[styles.track, { backgroundColor: palette.track }]} />
        <View
          pointerEvents="none"
          style={[
            styles.fill,
            {
              left: lowX + THUMB / 2,
              width: Math.max(0, highX - lowX),
              backgroundColor: palette.fill,
            },
          ]}
        />
      </View>
      {width > 0 ? [thumb(0), thumb(1)] : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: 44, justifyContent: "center", userSelect: "none" },
  hit: { height: 44, justifyContent: "center" },
  track: { height: 6, borderRadius: 3 },
  fill: { position: "absolute", top: 19, height: 6, borderRadius: 3 },
  thumb: {
    position: "absolute",
    top: (44 - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
  },
  // Wider than the thumb and centred on it, so the bubble sits right above whatever its width is.
  bubbleWrap: {
    position: "absolute",
    bottom: THUMB + 6,
    left: -40,
    width: THUMB + 80,
    alignItems: "center",
  },
  bubble: {
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  bubbleText: { fontSize: 12, fontWeight: "700" },
  disabled: { opacity: 0.4 },
});
