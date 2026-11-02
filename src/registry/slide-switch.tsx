import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const PADDING = 3;

export interface SlideSwitchColors {
  off: string;
  on: string;
  thumb: string;
}

const DEFAULT_COLORS: SlideSwitchColors = {
  off: "#d1d5db",
  on: "#4f46e5",
  thumb: "#ffffff",
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

export interface SlideSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Dims the switch and ignores touches. */
  disabled?: boolean;
  /** Height of the track. The track is 1.8 times as wide. */
  size?: number;
  /** Spoken name of the switch. */
  label?: string;
  colors?: Partial<SlideSwitchColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A switch whose thumb can be dragged as well as tapped. It stretches while held, follows the
 * finger, and settles on whichever side it is nearer to (a flick decides it sooner). The track
 * cross-fades between the two colors, and screen readers get a standard switch with its state.
 */
export function SlideSwitch({
  value,
  onValueChange,
  disabled = false,
  size = 32,
  label,
  colors,
  style,
}: SlideSwitchProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();

  const trackWidth = size * 1.8;
  const thumb = size - PADDING * 2;
  const stretch = thumb * 0.28;
  // Space the thumb can travel; less while it is stretched, so it never leaves the track.
  const travel = trackWidth - PADDING * 2 - thumb;

  // 0 is off, 1 is on, and anything between is mid-drag.
  const pos = useRef(new Animated.Value(value ? 1 : 0)).current;
  const grow = useRef(new Animated.Value(0)).current;
  const posNow = useRef(value ? 1 : 0);
  const pressed = useRef(false);
  const dragging = useRef(false);
  const dragStart = useRef(0);

  const live = useRef({ value, disabled, travel, reduceMotion, onValueChange });
  live.current = { value, disabled, travel, reduceMotion, onValueChange };

  useEffect(() => {
    const id = pos.addListener(({ value: next }) => (posNow.current = next));
    return () => pos.removeListener(id);
  }, [pos]);

  const animate = (node: Animated.Value, toValue: number) => {
    if (live.current.reduceMotion) {
      node.setValue(toValue);
      return;
    }
    // Width and colors are not supported by the native driver, so the switch runs on the JS thread.
    Animated.spring(node, {
      toValue,
      stiffness: 520,
      damping: 30,
      mass: 1,
      useNativeDriver: false,
    }).start();
  };

  const syncGrow = () => animate(grow, pressed.current || dragging.current ? 1 : 0);

  // Follow the value when the parent changes it (and settle after a drag the parent accepted).
  useEffect(() => {
    if (!dragging.current) animate(pos, value ? 1 : 0);
    // animate reads everything through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduceMotion]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        !live.current.disabled && Math.abs(g.dx) > 3 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        dragging.current = true;
        dragStart.current = posNow.current;
        syncGrow();
      },
      onPanResponderMove: (_, g) => {
        pos.setValue(Math.max(0, Math.min(1, dragStart.current + g.dx / live.current.travel)));
      },
      onPanResponderRelease: (_, g) => {
        // A flick decides at once; a slow drag goes to the nearer side.
        const next = Math.abs(g.vx) > 0.3 ? g.vx > 0 : posNow.current > 0.5;
        // The click a mouse sends on release is not a tap, so keep dragging set a moment longer.
        setTimeout(() => (dragging.current = false), 80);
        animate(pos, next ? 1 : 0);
        syncGrow();
        if (next !== live.current.value) live.current.onValueChange(next);
      },
      onPanResponderTerminate: () => {
        setTimeout(() => (dragging.current = false), 80);
        animate(pos, live.current.value ? 1 : 0);
        syncGrow();
      },
    }),
  ).current;

  const thumbWidth = grow.interpolate({
    inputRange: [0, 1],
    outputRange: [thumb, thumb + stretch],
  });
  const room = grow.interpolate({ inputRange: [0, 1], outputRange: [travel, travel - stretch] });

  return (
    <View {...pan.panHandlers} style={[styles.root, { opacity: disabled ? 0.5 : 1 }, style]}>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled }}
        aria-checked={value}
        aria-label={label}
        disabled={disabled}
        onPress={() => {
          if (!dragging.current) onValueChange(!value);
        }}
        onPressIn={() => {
          pressed.current = true;
          syncGrow();
        }}
        onPressOut={() => {
          pressed.current = false;
          syncGrow();
        }}
        style={[
          styles.track,
          { width: trackWidth, height: size, borderRadius: size / 2, backgroundColor: palette.off },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fill,
            { borderRadius: size / 2, backgroundColor: palette.on, opacity: pos },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              top: PADDING,
              left: PADDING,
              width: thumbWidth,
              height: thumb,
              borderRadius: thumb / 2,
              backgroundColor: palette.thumb,
              transform: [{ translateX: Animated.multiply(pos, room) }],
            },
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // userSelect keeps a mouse drag on the web from selecting text instead of moving the thumb.
  root: { alignSelf: "flex-start", userSelect: "none" },
  track: { overflow: "hidden" },
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  thumb: { position: "absolute", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)" },
});
