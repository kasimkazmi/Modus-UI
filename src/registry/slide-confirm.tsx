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
// Gap between the thumb and the edge of the track.
const PAD = 4;

export interface SlideConfirmColors {
  track: string;
  fill: string;
  thumb: string;
  icon: string;
  text: string;
  confirmedText: string;
}

const DEFAULT_COLORS: SlideConfirmColors = {
  track: "#e5e7eb",
  fill: "#4f46e5",
  thumb: "#ffffff",
  icon: "#4f46e5",
  text: "#374151",
  confirmedText: "#ffffff",
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

export interface SlideConfirmProps {
  /** Called once when the thumb reaches the end, or when a screen reader activates the control. */
  onConfirm: () => void;
  label?: string;
  /** Shown on the track once confirmed. */
  confirmedLabel?: string;
  /** Fraction of the track the thumb must cover for the slide to count. */
  threshold?: number;
  /** Height of the track; the thumb is a little smaller. */
  height?: number;
  disabled?: boolean;
  /** Milliseconds after confirming until the thumb springs back and can be used again. 0 keeps it confirmed. */
  resetAfter?: number;
  colors?: Partial<SlideConfirmColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A "slide to confirm" control for actions that should not happen by accident, like paying or
 * deleting. Drag the thumb along the track: the track fills behind it, the label fades away, and
 * letting go early springs it back. It is also one button for screen readers and the keyboard, so
 * confirming never depends on the gesture.
 */
export function SlideConfirm({
  onConfirm,
  label = "Slide to confirm",
  confirmedLabel = "Confirmed",
  threshold = 0.9,
  height = 56,
  disabled = false,
  resetAfter = 0,
  colors,
  style,
}: SlideConfirmProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [confirmed, setConfirmed] = useState(false);
  const thumb = height - PAD * 2;

  const x = useRef(new Animated.Value(0)).current;
  // How far the thumb can travel; the fill and the label are derived from it, so they stay in step.
  const travelValue = useRef(new Animated.Value(1)).current;
  const doneValue = useRef(new Animated.Value(0)).current;
  const [derived] = useState(() => {
    const progress = Animated.divide(x, travelValue);
    return {
      fill: Animated.subtract(x, travelValue),
      labelOpacity: progress.interpolate({
        inputRange: [0, 0.55],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
      labelShift: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 28] }),
    };
  });

  const fired = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The responder is created once, so it reads the latest props from here.
  const live = useRef({ travel: 1, threshold, disabled, reduceMotion, onConfirm, resetAfter });
  live.current = { ...live.current, threshold, disabled, reduceMotion, onConfirm, resetAfter };

  useEffect(() => () => clearTimeout(timer.current), []);

  const spring = (value: Animated.Value, toValue: number) => {
    if (live.current.reduceMotion) {
      value.setValue(toValue);
      return;
    }
    Animated.spring(value, {
      toValue,
      stiffness: 380,
      damping: 30,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  const reset = () => {
    fired.current = false;
    setConfirmed(false);
    spring(x, 0);
    spring(doneValue, 0);
  };

  const complete = () => {
    if (fired.current || live.current.disabled) return;
    fired.current = true;
    setConfirmed(true);
    spring(x, live.current.travel);
    spring(doneValue, 1);
    live.current.onConfirm();
    if (live.current.resetAfter > 0) {
      timer.current = setTimeout(reset, live.current.resetAfter);
    }
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !live.current.disabled && !fired.current,
      onMoveShouldSetPanResponder: () => !live.current.disabled && !fired.current,
      onPanResponderGrant: () => x.stopAnimation(),
      onPanResponderMove: (_, g) => x.setValue(Math.max(0, Math.min(live.current.travel, g.dx))),
      onPanResponderRelease: (_, g) => {
        const { travel, threshold: needed } = live.current;
        if (g.dx >= travel * needed) complete();
        else spring(x, 0);
      },
      onPanResponderTerminate: () => spring(x, 0),
    }),
  ).current;

  const onLayout = (event: LayoutChangeEvent) => {
    const travel = Math.max(1, event.nativeEvent.layout.width - thumb - PAD * 2);
    live.current.travel = travel;
    travelValue.setValue(travel);
    if (fired.current) x.setValue(travel);
  };

  const spoken = confirmed ? confirmedLabel : label;

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={spoken}
      aria-label={spoken}
      accessibilityState={{ disabled }}
      aria-disabled={disabled}
      accessibilityActions={[{ name: "activate", label }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "activate") complete();
      }}
      focusable={!disabled}
      onKeyDown={(event) => {
        const key = event.nativeEvent.key;
        if (key === "Enter" || key === " ") complete();
      }}
      onLayout={onLayout}
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: palette.track,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fill,
          {
            backgroundColor: palette.fill,
            borderRadius: height / 2,
            transform: [{ translateX: derived.fill }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.center,
          {
            paddingLeft: thumb + PAD * 2,
            opacity: derived.labelOpacity,
            transform: [{ translateX: derived.labelShift }],
          },
        ]}
      >
        <Text numberOfLines={1} style={[styles.label, { color: palette.text }]}>
          {label}
        </Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.center, { opacity: doneValue }]}>
        <Text numberOfLines={1} style={[styles.label, { color: palette.confirmedText }]}>
          {confirmedLabel}
        </Text>
      </Animated.View>
      <Animated.View
        {...pan.panHandlers}
        style={[
          styles.thumb,
          {
            width: thumb,
            height: thumb,
            borderRadius: thumb / 2,
            backgroundColor: palette.thumb,
            transform: [{ translateX: x }],
          },
        ]}
      >
        <Text style={[styles.icon, { fontSize: thumb * 0.46, color: palette.icon }]}>
          {confirmed ? "✓" : "→"}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // userSelect keeps a mouse drag on the web from selecting the label instead of moving the thumb.
  track: { overflow: "hidden", justifyContent: "center", userSelect: "none" },
  fill: { position: "absolute", top: 0, bottom: 0, left: 0, width: "100%" },
  center: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  label: { fontSize: 16, fontWeight: "600" },
  thumb: {
    position: "absolute",
    top: PAD,
    left: PAD,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.22)",
  },
  icon: { fontWeight: "700" },
});
