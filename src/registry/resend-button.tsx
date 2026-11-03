import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface ResendButtonColors {
  accent: string;
  disabled: string;
}

const DEFAULT_COLORS: ResendButtonColors = {
  accent: "#4f46e5",
  disabled: "#9ca3af",
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

export interface ResendButtonProps {
  /** Called when the button is pressed after the wait; the wait then starts over. */
  onResend: () => void;
  /** How long to wait before it can be pressed, in seconds. */
  seconds?: number;
  label?: string;
  colors?: Partial<ResendButtonColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * The "Resend code" link under a verification form. It starts out waiting, showing the seconds left,
 * and becomes pressable when the wait is over, pulsing once to say so. Pressing it calls
 * `onResend` and starts the wait again. The time is not announced each second; only "You can resend
 * now" is.
 */
export function ResendButton({
  onResend,
  seconds = 30,
  label = "Resend code",
  colors,
  style,
}: ResendButtonProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [left, setLeft] = useState(seconds);
  const pulse = useRef(new Animated.Value(1)).current;
  const ready = left <= 0;

  useEffect(() => {
    if (ready) return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [ready]);

  useEffect(() => {
    if (!ready || reduceMotion) return;
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 160, useNativeDriver: NATIVE_DRIVER }),
      Animated.spring(pulse, {
        toValue: 1,
        stiffness: 400,
        damping: 14,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }),
    ]).start();
  }, [ready, reduceMotion, pulse]);

  const text = ready
    ? label
    : `${label} in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={ready ? label : `${label}, available soon`}
      accessibilityState={{ disabled: !ready }}
      aria-disabled={!ready}
      disabled={!ready}
      onPress={() => {
        onResend();
        setLeft(seconds);
      }}
      hitSlop={8}
      style={[styles.root, style]}
    >
      <Animated.Text
        style={[
          styles.text,
          { color: ready ? palette.accent : palette.disabled, transform: [{ scale: pulse }] },
        ]}
      >
        {text}
      </Animated.Text>
      <Text accessibilityLiveRegion="polite" style={styles.sr}>
        {ready ? "You can resend now" : ""}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: "center", minHeight: 44, justifyContent: "center", userSelect: "none" },
  text: { fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
  sr: { position: "absolute", width: 1, height: 1, opacity: 0 },
});
