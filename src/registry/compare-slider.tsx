import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const HANDLE = 40;

export interface CompareSliderColors {
  line: string;
  handle: string;
  arrows: string;
}

const DEFAULT_COLORS: CompareSliderColors = {
  line: "#ffffff",
  handle: "#ffffff",
  arrows: "#111827",
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

export interface CompareSliderProps {
  /** Shown on the left of the divider. */
  before: ReactNode;
  /** Shown on the right of the divider. */
  after: ReactNode;
  /** Where the divider starts, from 0 to 1. */
  initial?: number;
  height?: number;
  /** Spoken name of the slider. */
  label?: string;
  colors?: Partial<CompareSliderColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A before and after comparison. Drag the handle, or touch anywhere, and the divider follows to reveal
 * more of one side or the other. It is an adjustable control for screen readers, which can step it by
 * ten percent, and the position is read out as a percentage.
 */
export function CompareSlider({
  before,
  after,
  initial = 0.5,
  height = 220,
  label = "Comparison",
  colors,
  style,
}: CompareSliderProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const [percent, setPercent] = useState(Math.round(initial * 100));
  const pos = useRef(new Animated.Value(initial)).current;
  const at = useRef(initial);
  const start = useRef(initial);
  const live = useRef({ width, reduceMotion });
  live.current = { width, reduceMotion };

  const set = (next: number, animate = false) => {
    const clamped = Math.max(0, Math.min(1, next));
    at.current = clamped;
    setPercent(Math.round(clamped * 100));
    if (animate && !live.current.reduceMotion) {
      Animated.timing(pos, { toValue: clamped, duration: 180, useNativeDriver: false }).start();
    } else {
      pos.setValue(clamped);
    }
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const w = Math.max(1, live.current.width);
        set(event.nativeEvent.locationX / w);
        start.current = at.current;
      },
      onPanResponderMove: (_, g) => set(start.current + g.dx / Math.max(1, live.current.width)),
    }),
  ).current;

  const x = pos.interpolate({ inputRange: [0, 1], outputRange: [0, width] });

  return (
    <View
      {...responder.panHandlers}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      aria-label={label}
      accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent} percent` }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) =>
        set(at.current + (event.nativeEvent.actionName === "increment" ? 0.1 : -0.1), true)
      }
      style={[styles.root, { height }, style]}
    >
      <View style={StyleSheet.flatten([styles.layer, { width }])} pointerEvents="none">
        {after}
      </View>
      <Animated.View style={[styles.clip, { width: x }]} pointerEvents="none">
        <View style={{ width, height }}>{before}</View>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.line, { backgroundColor: palette.line, transform: [{ translateX: x }] }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.handle,
          {
            backgroundColor: palette.handle,
            top: height / 2 - HANDLE / 2,
            transform: [{ translateX: Animated.subtract(x, HANDLE / 2) }],
          },
        ]}
      >
        <Text style={[styles.arrows, { color: palette.arrows }]}>◂▸</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: "hidden", borderRadius: 16, userSelect: "none" },
  layer: { position: "absolute", top: 0, bottom: 0, left: 0 },
  clip: { position: "absolute", top: 0, bottom: 0, left: 0, overflow: "hidden" },
  line: { position: "absolute", top: 0, bottom: 0, left: -1, width: 2 },
  handle: {
    position: "absolute",
    left: 0,
    width: HANDLE,
    height: HANDLE,
    borderRadius: HANDLE / 2,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
  },
  arrows: { fontSize: 14, fontWeight: "800" },
});
