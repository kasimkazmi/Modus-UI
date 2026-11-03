import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface HoldConfirmColors {
  background: string;
  fill: string;
  text: string;
}

const DEFAULT_COLORS: HoldConfirmColors = {
  background: "#fee2e2",
  fill: "#dc2626",
  text: "#7f1d1d",
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

export interface HoldConfirmProps {
  label: string;
  /** Called once when the button has been held long enough, or activated by a screen reader or Enter. */
  onComplete: () => void;
  /** How long to hold, in milliseconds. */
  duration?: number;
  /** Text shown after it completes. */
  doneLabel?: string;
  colors?: Partial<HoldConfirmColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A button for actions that should not happen by accident, such as deleting an account. A colour fills
 * the button while it is held and the action runs when it is full; letting go early drains it back and
 * nothing happens. Because holding is hard for some people, a screen reader's activate action and the
 * Enter key on the web run the action straight away.
 */
export function HoldConfirm({
  label,
  onComplete,
  duration = 1200,
  doneLabel = "Done",
  colors,
  style,
}: HoldConfirmProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const fill = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);
  const live = useRef({ onComplete, reduceMotion, duration });
  live.current = { onComplete, reduceMotion, duration };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const finish = () => {
    setDone(true);
    live.current.onComplete();
    timer.current = setTimeout(() => {
      setDone(false);
      fill.setValue(0);
    }, 1400);
  };

  const press = () => {
    if (done) return;
    fill.stopAnimation();
    if (live.current.reduceMotion) {
      // Without motion the hold is a plain timer, and the fill jumps to full when it ends.
      timer.current = setTimeout(() => {
        fill.setValue(1);
        finish();
      }, live.current.duration);
      return;
    }
    Animated.timing(fill, {
      toValue: 1,
      duration: live.current.duration,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) finish();
    });
  };

  const release = () => {
    if (done) return;
    if (timer.current) clearTimeout(timer.current);
    fill.stopAnimation();
    if (live.current.reduceMotion) fill.setValue(0);
    else Animated.timing(fill, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  };

  const keys = {
    onKeyDown: (event: { key: string }) => {
      if (event.key === "Enter" && !done) finish();
    },
  } as object;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={done ? doneLabel : `${label}, hold to confirm`}
      accessibilityHint="Press and hold, or activate to confirm"
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={() => !done && finish()}
      onPressIn={press}
      onPressOut={release}
      {...keys}
      style={[styles.root, { backgroundColor: palette.background }, style]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fill,
          {
            backgroundColor: palette.fill,
            width: fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          },
        ]}
      />
      <View pointerEvents="none" style={styles.center}>
        <Text style={[styles.text, { color: palette.text }]}>{done ? doneLabel : label}</Text>
        {done ? null : <Text style={[styles.hint, { color: palette.text }]}>Hold</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 56,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    userSelect: "none",
  },
  fill: { position: "absolute", top: 0, bottom: 0, left: 0, opacity: 0.85 },
  center: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  text: { fontSize: 16, fontWeight: "800" },
  hint: { fontSize: 12, fontWeight: "700", opacity: 0.6 },
});
