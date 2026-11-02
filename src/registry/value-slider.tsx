import { useEffect, useMemo, useRef, useState } from "react";
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
const THUMB = 26;
const TRACK = 6;
// Room above the track for the value bubble.
const BUBBLE_ZONE = 40;
const BUBBLE_WIDTH = 48;

export interface ValueSliderColors {
  track: string;
  fill: string;
  thumb: string;
  bubble: string;
  bubbleText: string;
}

const DEFAULT_COLORS: ValueSliderColors = {
  track: "#e5e7eb",
  fill: "#4f46e5",
  thumb: "#ffffff",
  bubble: "#111827",
  bubbleText: "#ffffff",
};

// userSelect keeps a mouse drag on the web from selecting text instead of moving the thumb.
const styles = StyleSheet.create({ root: { alignSelf: "stretch", userSelect: "none" } });

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/** How many decimals a step has, so snapped values do not pick up float noise (0.1 + 0.2). */
function decimalsOf(step: number) {
  const [, fraction = ""] = String(step).split(".");
  return fraction.length;
}

export interface ValueSliderProps {
  value: number;
  /** Called with the snapped value as the thumb moves. */
  onValueChange: (value: number) => void;
  /** Called once with the final value when the finger lifts. */
  onSlidingComplete?: (value: number) => void;
  /** The value at the left end. */
  min?: number;
  /** The value at the right end. */
  max?: number;
  /** Values snap to multiples of this, counted from `min`. */
  step?: number;
  /** Shows the current value above the thumb while it is held. */
  showBubble?: boolean;
  /** Dims the slider and ignores touches. */
  disabled?: boolean;
  /** Spoken name of the slider. */
  label?: string;
  colors?: Partial<ValueSliderColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A slider you can drag or tap. Touching the track jumps the thumb there; grabbing the thumb moves
 * it without a jump. The thumb grows while held and a bubble above it reads out the value, which
 * snaps to `step` and stays within `min` and `max`. Screen readers get an adjustable control with
 * increment and decrement actions.
 */
export function ValueSlider({
  value,
  onValueChange,
  onSlidingComplete,
  min = 0,
  max = 100,
  step = 1,
  showBubble = true,
  disabled = false,
  label = "Value",
  colors,
  style,
}: ValueSliderProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);

  const range = max - min || 1;
  const span = Math.max(0, width - THUMB);
  const ratioOf = (next: number) => Math.max(0, Math.min(1, (next - min) / range));

  // 0 to 1 along the track. Widths cannot use the native driver, so this one runs on the JS thread.
  const pos = useRef(new Animated.Value(ratioOf(value))).current;
  const posNow = useRef(ratioOf(value));
  const grow = useRef(new Animated.Value(0)).current;
  const bubble = useRef(new Animated.Value(0)).current;
  const [holding, setHolding] = useState(false);

  // Built once per width and reused, so react-native-web does not rebuild the animated styles.
  const thumbX = useMemo(
    () => pos.interpolate({ inputRange: [0, 1], outputRange: [0, span] }),
    [pos, span],
  );
  const fillWidth = useMemo(
    () => pos.interpolate({ inputRange: [0, 1], outputRange: [THUMB / 2, THUMB / 2 + span] }),
    [pos, span],
  );
  const thumbScale = useMemo(
    () => grow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }),
    [grow],
  );
  const bubbleStyle = useMemo(
    () => ({
      opacity: bubble,
      transform: [
        { translateY: bubble.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
        { scale: bubble.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
      ],
    }),
    [bubble],
  );

  const live = useRef({
    value,
    min,
    max,
    step,
    span,
    disabled,
    reduceMotion,
    onValueChange,
    onSlidingComplete,
  });
  live.current = {
    value,
    min,
    max,
    step,
    span,
    disabled,
    reduceMotion,
    onValueChange,
    onSlidingComplete,
  };
  const drag = useRef({ active: false, startX: 0, offset: 0, last: value });

  useEffect(() => {
    const id = pos.addListener(({ value: next }) => (posNow.current = next));
    return () => pos.removeListener(id);
  }, [pos]);

  const animate = (node: Animated.Value, toValue: number, native: boolean) => {
    if (live.current.reduceMotion) {
      node.setValue(toValue);
      return;
    }
    Animated.spring(node, {
      toValue,
      stiffness: 420,
      damping: 28,
      mass: 1,
      useNativeDriver: native,
    }).start();
  };

  // Follow the value when the parent changes it, except while the thumb is under a finger.
  useEffect(() => {
    if (!drag.current.active) animate(pos, ratioOf(value), false);
    // animate and ratioOf read from refs and props that the dependencies below already cover.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, min, max, reduceMotion]);

  const snap = (raw: number) => {
    const { min: lo, max: hi, step: unit } = live.current;
    const snapped = lo + Math.round((raw - lo) / unit) * unit;
    return Number(Math.max(lo, Math.min(hi, snapped)).toFixed(decimalsOf(unit)));
  };

  /** Moves the thumb to a horizontal position inside the slider and reports the snapped value. */
  const moveTo = (x: number) => {
    const { span: room, min: lo, max: hi } = live.current;
    if (room <= 0) return;
    const ratio = Math.max(0, Math.min(1, (x + drag.current.offset - THUMB / 2) / room));
    const next = snap(lo + ratio * (hi - lo));
    pos.setValue((next - lo) / (hi - lo || 1));
    if (next !== drag.current.last) {
      drag.current.last = next;
      live.current.onValueChange(next);
    }
  };

  const hold = (on: boolean) => {
    setHolding(on);
    animate(grow, on ? 1 : 0, NATIVE_DRIVER);
    animate(bubble, on ? 1 : 0, NATIVE_DRIVER);
  };

  const release = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    hold(false);
    live.current.onSlidingComplete?.(drag.current.last);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !live.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const x = event.nativeEvent.locationX;
        const center = THUMB / 2 + posNow.current * live.current.span;
        const onThumb = Math.abs(x - center) <= THUMB / 2 + 8;
        drag.current = {
          active: true,
          startX: x,
          // Grabbing the thumb keeps it where it is; touching the track jumps it to the finger.
          offset: onThumb ? center - x : 0,
          last: live.current.value,
        };
        hold(true);
        if (!onThumb) moveTo(x);
      },
      onPanResponderMove: (_, g) => moveTo(drag.current.startX + g.dx),
      onPanResponderRelease: release,
      onPanResponderTerminate: release,
    }),
  ).current;

  const nudge = (direction: 1 | -1) => {
    const next = Number(
      Math.max(min, Math.min(max, value + direction * step)).toFixed(decimalsOf(step)),
    );
    if (next === value) return;
    onValueChange(next);
    onSlidingComplete?.(next);
  };

  const height = BUBBLE_ZONE + THUMB;
  const trackTop = BUBBLE_ZONE + (THUMB - TRACK) / 2;

  return (
    <View
      {...(disabled ? {} : pan.panHandlers)}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      accessibilityValue={{ min, max, now: value }}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) =>
        nudge(event.nativeEvent.actionName === "increment" ? 1 : -1)
      }
      style={[styles.root, { height, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {/* Everything inside ignores the pointer, so locationX is always measured from the slider. */}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: trackTop,
            height: TRACK,
            borderRadius: TRACK / 2,
            backgroundColor: palette.track,
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            top: trackTop,
            height: TRACK,
            width: fillWidth,
            borderRadius: TRACK / 2,
            backgroundColor: palette.fill,
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            top: BUBBLE_ZONE,
            width: THUMB,
            height: THUMB,
            transform: [{ translateX: thumbX }],
          }}
        >
          <Animated.View
            style={{
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: palette.thumb,
              borderWidth: 2,
              borderColor: palette.fill,
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
              transform: [{ scale: thumbScale }],
            }}
          />
          {showBubble ? (
            <Animated.View
              style={[
                {
                  position: "absolute",
                  bottom: THUMB + 8,
                  left: (THUMB - BUBBLE_WIDTH) / 2,
                  width: BUBBLE_WIDTH,
                  height: 28,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: palette.bubble,
                },
                bubbleStyle,
              ]}
            >
              <Text
                numberOfLines={1}
                aria-hidden={!holding}
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: palette.bubbleText,
                  userSelect: "none",
                }}
              >
                {value}
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}
