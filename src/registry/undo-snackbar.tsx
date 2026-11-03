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

export interface UndoSnackbarColors {
  background: string;
  text: string;
  action: string;
  timer: string;
}

const DEFAULT_COLORS: UndoSnackbarColors = {
  background: "#111827",
  text: "#ffffff",
  action: "#a5b4fc",
  timer: "rgba(255, 255, 255, 0.35)",
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

export interface UndoSnackbarProps {
  open: boolean;
  /** Called when the time runs out or the action is pressed. */
  onClose: () => void;
  message: string;
  actionLabel?: string;
  /** Called when the action is pressed, before the snackbar closes. */
  onAction?: () => void;
  /** How long it stays, in milliseconds. */
  duration?: number;
  colors?: Partial<UndoSnackbarColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * The bar that appears after a delete with an Undo button. It slides up from the bottom of its parent,
 * a thin line along its edge shows how long is left, and it closes itself when that runs out. The
 * message is announced when it opens, and the action is an ordinary button.
 */
export function UndoSnackbar({
  open,
  onClose,
  message,
  actionLabel = "Undo",
  onAction,
  duration = 5000,
  colors,
  style,
}: UndoSnackbarProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const t = useRef(new Animated.Value(0)).current;
  const timer = useRef(new Animated.Value(1)).current;
  const [mounted, setMounted] = useState(open);
  const live = useRef({ onClose });
  live.current = { onClose };

  useEffect(() => {
    if (open) setMounted(true);
    if (reduceMotion) {
      t.setValue(open ? 1 : 0);
      if (!open) setMounted(false);
      return;
    }
    Animated.spring(t, {
      toValue: open ? 1 : 0,
      stiffness: 380,
      damping: 30,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open, reduceMotion, t]);

  useEffect(() => {
    if (!open) return;
    AccessibilityInfo.announceForAccessibility(message);
    timer.setValue(1);
    const drain = Animated.timing(timer, {
      toValue: 0,
      duration,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    if (!reduceMotion) drain.start();
    const id = setTimeout(() => live.current.onClose(), duration);
    return () => {
      drain.stop();
      clearTimeout(id);
    };
  }, [open, message, duration, reduceMotion, timer]);

  if (!mounted) return null;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.root,
        {
          backgroundColor: palette.background,
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        },
        style,
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.message, { color: palette.text }]}>{message}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={() => {
            onAction?.();
            onClose();
          }}
          hitSlop={8}
          style={styles.action}
        >
          <Text style={[styles.actionText, { color: palette.action }]}>{actionLabel}</Text>
        </Pressable>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.timer,
          {
            backgroundColor: palette.timer,
            width: timer.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 16, minHeight: 52 },
  message: { flex: 1, fontSize: 15 },
  action: { minHeight: 52, paddingHorizontal: 16, justifyContent: "center", userSelect: "none" },
  actionText: { fontSize: 15, fontWeight: "800" },
  timer: { height: 3 },
});
