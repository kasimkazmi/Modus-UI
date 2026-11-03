import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export type ActionStatus = "idle" | "loading" | "success" | "error";

export interface ActionButtonColors {
  background: string;
  text: string;
  success: string;
  error: string;
}

const DEFAULT_COLORS: ActionButtonColors = {
  background: "#4f46e5",
  text: "#ffffff",
  success: "#16a34a",
  error: "#dc2626",
};

const INDEX: Record<ActionStatus, number> = { idle: 0, loading: 1, success: 2, error: 3 };

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

export interface ActionButtonProps {
  label: string;
  /** Called on press. If it returns a promise the button shows loading until it settles. */
  onPress: () => void | Promise<unknown>;
  /** Sets the state yourself instead of following the promise. */
  status?: ActionStatus;
  variant?: "solid" | "outline" | "ghost";
  size?: "md" | "lg";
  /** Text announced and shown in the success state. */
  successLabel?: string;
  /** Text announced and shown in the error state. */
  errorLabel?: string;
  /** Milliseconds the success or error state stays before the button goes back to idle. */
  resetAfter?: number;
  disabled?: boolean;
  /** Stretches the button to the full width of its parent. */
  fullWidth?: boolean;
  colors?: Partial<ActionButtonColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A button that carries its own progress. Press it and, if the action returns a promise, the label
 * gives way to a spinner, then to a tick that pops in, or a cross and a shake if it fails, before it
 * settles back. The button never changes size, so nothing around it moves, and the outcome is read
 * out. Pressing while busy does nothing.
 */
export function ActionButton({
  label,
  onPress,
  status,
  variant = "solid",
  size = "md",
  successLabel = "Done",
  errorLabel = "Failed",
  resetAfter = 1600,
  disabled = false,
  fullWidth = false,
  colors,
  style,
}: ActionButtonProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [inner, setInner] = useState<ActionStatus>("idle");
  const current = status ?? inner;
  const m = useRef(new Animated.Value(INDEX[current])).current;
  const spin = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      timers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) m.setValue(INDEX[current]);
    else
      Animated.timing(m, {
        toValue: INDEX[current],
        duration: 220,
        useNativeDriver: false,
      }).start();
    if (current === "error" && !reduceMotion) {
      Animated.sequence(
        [-7, 7, -5, 5, -2, 0].map((toValue) =>
          Animated.timing(shake, { toValue, duration: 50, useNativeDriver: NATIVE_DRIVER }),
        ),
      ).start();
    }
  }, [current, reduceMotion, m, shake]);

  useEffect(() => {
    if (current !== "loading" || reduceMotion) {
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 750,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [current, reduceMotion, spin]);

  const handlePress = () => {
    if (disabled || current !== "idle") return;
    const result = onPress();
    if (status !== undefined || !result || typeof (result as Promise<unknown>).then !== "function")
      return;
    setInner("loading");
    const finish = (next: ActionStatus) => {
      if (!mounted.current) return;
      setInner(next);
      timers.current.push(setTimeout(() => mounted.current && setInner("idle"), resetAfter));
    };
    (result as Promise<unknown>).then(
      () => finish("success"),
      () => finish("error"),
    );
  };

  const dip = (down: boolean) => {
    if (reduceMotion) return;
    Animated.spring(press, {
      toValue: down ? 0.97 : 1,
      stiffness: 500,
      damping: 26,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  const solid = variant === "solid";
  const ink = solid ? palette.text : palette.background;
  const idleFill = solid ? palette.background : "transparent";
  const fill = m.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [idleFill, idleFill, palette.success, palette.error],
  });
  const mark = (index: number) =>
    m.interpolate({
      inputRange: [index - 1, index, index + 1],
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });
  const markInk = current === "success" || current === "error" ? palette.text : ink;
  const height = size === "lg" ? 56 : 48;
  const spoken =
    current === "loading"
      ? `${label}, working`
      : current === "success"
        ? successLabel
        : current === "error"
          ? errorLabel
          : label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityState={{ busy: current === "loading", disabled }}
      aria-busy={current === "loading"}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={() => dip(true)}
      onPressOut={() => dip(false)}
      style={[fullWidth ? styles.full : styles.auto, style]}
    >
      <Animated.View
        style={[
          styles.button,
          {
            minHeight: height,
            borderRadius: height * 0.3,
            backgroundColor: fill,
            borderWidth: variant === "outline" ? 2 : 0,
            borderColor:
              current === "success"
                ? palette.success
                : current === "error"
                  ? palette.error
                  : palette.background,
            opacity: disabled ? 0.45 : 1,
            transform: [{ scale: press }, { translateX: shake }],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.label,
            { color: ink, opacity: mark(0), fontSize: size === "lg" ? 17 : 16 },
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
        <Animated.View pointerEvents="none" style={[styles.center, { opacity: mark(1) }]}>
          <Animated.View
            style={[
              styles.spinner,
              {
                borderColor: ink,
                borderTopColor: "transparent",
                transform: [
                  {
                    rotate: spin.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              },
            ]}
          />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.center,
            {
              opacity: mark(2),
              transform: [
                { scale: mark(2).interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
              ],
            },
          ]}
        >
          <View style={[styles.tick, { borderColor: markInk }]} />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.center,
            {
              opacity: mark(3),
              transform: [
                { scale: mark(3).interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
              ],
            },
          ]}
        >
          <Text style={[styles.cross, { color: markInk }]}>×</Text>
        </Animated.View>
      </Animated.View>
      <Text accessibilityLiveRegion="polite" style={styles.sr}>
        {current === "success" ? successLabel : current === "error" ? errorLabel : ""}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  auto: { alignSelf: "flex-start" },
  full: { alignSelf: "stretch" },
  button: {
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
  },
  label: { fontWeight: "700" },
  center: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: { width: 22, height: 22, borderRadius: 11, borderWidth: 3 },
  tick: {
    width: 9,
    height: 17,
    marginTop: -3,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    transform: [{ rotate: "45deg" }],
  },
  cross: { fontSize: 30, lineHeight: 32, fontWeight: "300" },
  sr: { position: "absolute", width: 1, height: 1, opacity: 0 },
});
