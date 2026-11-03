import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface CountdownTimerColors {
  text: string;
  track: string;
  fill: string;
  done: string;
}

const DEFAULT_COLORS: CountdownTimerColors = {
  text: "#111827",
  track: "#e5e7eb",
  fill: "#4f46e5",
  done: "#16a34a",
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

const format = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export interface CountdownTimerProps {
  /** How long to count down from, in seconds. Changing it restarts the timer. */
  seconds: number;
  /** Pauses the countdown when false. */
  running?: boolean;
  /** Called once when the time runs out. */
  onComplete?: () => void;
  /** Spoken name of the timer. */
  label?: string;
  colors?: Partial<CountdownTimerColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A minutes and seconds countdown with a bar that drains underneath. Pausing holds both the digits
 * and the bar and resuming carries on from there. When the time is up the digits turn to the done
 * colour and `onComplete` fires once. The remaining time is not announced every second; only
 * "Time is up" is, so a screen reader is not flooded.
 */
export function CountdownTimer({
  seconds,
  running = true,
  onComplete,
  label = "Timer",
  colors,
  style,
}: CountdownTimerProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const total = seconds * 1000;
  const [remaining, setRemaining] = useState(total);
  const left = useRef(total);
  const bar = useRef(new Animated.Value(1)).current;
  const finished = useRef(false);
  const live = useRef({ onComplete });
  live.current = { onComplete };

  // A new duration starts over.
  useEffect(() => {
    left.current = total;
    finished.current = false;
    setRemaining(total);
    bar.setValue(1);
  }, [total, bar]);

  // The digits follow a wall clock, so they stay right when the tab is slow.
  useEffect(() => {
    if (!running || left.current <= 0) return;
    const end = Date.now() + left.current;
    const id = setInterval(() => {
      left.current = Math.max(0, end - Date.now());
      setRemaining(left.current);
      if (left.current === 0 && !finished.current) {
        finished.current = true;
        clearInterval(id);
        live.current.onComplete?.();
      }
    }, 200);
    return () => clearInterval(id);
  }, [running, total]);

  // The bar drains over the time that is left, or steps once a second with reduced motion.
  useEffect(() => {
    if (!running || left.current <= 0) return;
    if (reduceMotion) {
      bar.setValue(left.current / total);
      return;
    }
    const animation = Animated.timing(bar, {
      toValue: 0,
      duration: left.current,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [running, reduceMotion, total, bar]);

  useEffect(() => {
    if (reduceMotion) bar.setValue(remaining / total);
  }, [remaining, reduceMotion, total, bar]);

  const done = remaining <= 0;

  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`${label}, ${done ? "time is up" : format(remaining)}`}
      style={[styles.root, style]}
    >
      <Text style={[styles.digits, { color: done ? palette.done : palette.text }]}>
        {format(remaining)}
      </Text>
      <View style={[styles.track, { backgroundColor: palette.track }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: done ? palette.done : palette.fill,
              width: bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            },
          ]}
        />
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.sr}>
        {done ? "Time is up" : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12, alignItems: "stretch" },
  digits: { fontSize: 56, fontWeight: "800", textAlign: "center", fontVariant: ["tabular-nums"] },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  sr: { position: "absolute", width: 1, height: 1, opacity: 0 },
});
