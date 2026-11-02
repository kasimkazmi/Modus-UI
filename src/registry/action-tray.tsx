import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
// Space left under the tray when it is hidden, so its shadow never peeks out.
const HIDE_GAP = 24;
// How far, or how fast, a drag must go to dismiss the tray.
const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 0.8;

export interface ActionTrayAction {
  label: string;
  onPress: () => void;
  /** Draws the action in the destructive color. */
  destructive?: boolean;
  disabled?: boolean;
}

export interface ActionTrayColors {
  backdrop: string;
  surface: string;
  text: string;
  mutedText: string;
  destructive: string;
  divider: string;
  handle: string;
}

const DEFAULT_COLORS: ActionTrayColors = {
  backdrop: "rgba(0, 0, 0, 0.4)",
  surface: "#ffffff",
  text: "#111827",
  mutedText: "#6b7280",
  destructive: "#dc2626",
  divider: "#e5e7eb",
  handle: "#d1d5db",
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

export interface ActionTrayProps {
  /** Whether the tray is showing. */
  open: boolean;
  /** Called when the tray should close: backdrop tap, Escape, a drag down, Cancel, or after an action. */
  onClose: () => void;
  title?: string;
  /** A line of smaller text under the title. */
  message?: string;
  actions: ActionTrayAction[];
  cancelLabel?: string;
  colors?: Partial<ActionTrayColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A bottom action list in the style of a native action sheet. It slides up from the bottom of its
 * parent over a dimmed backdrop, with the actions as one rounded group and Cancel as a separate
 * button. Tap the backdrop, press Escape, or drag the handle down to close it. It is drawn inside
 * its parent, so the parent must fill the area the tray should cover.
 */
export function ActionTray({
  open,
  onClose,
  title,
  message,
  actions,
  cancelLabel = "Cancel",
  colors,
  style,
}: ActionTrayProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [height, setHeight] = useState(0);
  // Distance the tray is pushed down: 0 when open, `height + HIDE_GAP` when hidden.
  const y = useRef(new Animated.Value(0)).current;

  const live = useRef({ open, onClose, height, reduceMotion });
  live.current = { open, onClose, height, reduceMotion };

  const moveTo = (target: number) => {
    if (live.current.reduceMotion) {
      y.setValue(target);
      return;
    }
    Animated.spring(y, {
      toValue: target,
      stiffness: 360,
      damping: 34,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  useEffect(() => {
    if (height === 0) return;
    moveTo(open ? 0 : height + HIDE_GAP);
    // moveTo reads everything it needs through the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, height]);

  // Escape closes the tray on the web.
  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") live.current.onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => y.stopAnimation(),
      onPanResponderMove: (_, g) => y.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          moveTo(live.current.height + HIDE_GAP);
          live.current.onClose();
          // If the parent ignores the request the tray is still open: bring it back.
          setTimeout(() => {
            if (live.current.open) moveTo(0);
          }, 80);
        } else {
          moveTo(0);
        }
      },
      onPanResponderTerminate: () => moveTo(0),
    }),
  ).current;

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (next === height) return;
    // Start hidden, so the first open slides in instead of appearing.
    if (height === 0) y.setValue(next + HIDE_GAP);
    setHeight(next);
  };

  const backdropOpacity = y.interpolate({
    inputRange: [0, (height || 1) + HIDE_GAP],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View
      pointerEvents={open ? "box-none" : "none"}
      aria-hidden={!open}
      style={[styles.root, style]}
    >
      <Animated.View
        aria-hidden
        pointerEvents={open ? "auto" : "none"}
        style={[styles.fill, { backgroundColor: palette.backdrop, opacity: backdropOpacity }]}
      >
        <Pressable accessible={false} focusable={false} onPress={onClose} style={styles.fill} />
      </Animated.View>
      <Animated.View
        role="dialog"
        aria-modal
        aria-label={title ?? "Actions"}
        accessibilityViewIsModal={open}
        onLayout={onLayout}
        style={[styles.tray, { opacity: height > 0 ? 1 : 0, transform: [{ translateY: y }] }]}
      >
        <View style={[styles.group, { backgroundColor: palette.surface }]}>
          <View {...pan.panHandlers} style={styles.header}>
            <View style={[styles.handle, { backgroundColor: palette.handle }]} />
            {title ? (
              <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
                {title}
              </Text>
            ) : null}
            {message ? (
              <Text style={[styles.message, { color: palette.mutedText }]}>{message}</Text>
            ) : null}
          </View>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityState={{ disabled: !!action.disabled }}
              aria-disabled={!!action.disabled}
              disabled={action.disabled}
              focusable={open && !action.disabled}
              onPress={() => {
                action.onPress();
                onClose();
              }}
              style={({ pressed }) => [
                styles.action,
                { borderTopColor: palette.divider },
                action.disabled && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.actionText,
                  { color: action.destructive ? palette.destructive : palette.text },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          focusable={open}
          onPress={onClose}
          style={({ pressed }) => [
            styles.cancel,
            { backgroundColor: palette.surface },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.cancelText, { color: palette.text }]}>{cancelLabel}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "flex-end",
  },
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  tray: { paddingHorizontal: 10, paddingBottom: 12, gap: 8 },
  group: { borderRadius: 16, overflow: "hidden" },
  // userSelect keeps a mouse drag on the web from selecting the title instead of moving the tray.
  header: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 4,
    userSelect: "none",
  },
  handle: { width: 36, height: 4, borderRadius: 2, marginBottom: 6 },
  title: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  message: { fontSize: 13, textAlign: "center" },
  action: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionText: { fontSize: 17, fontWeight: "500" },
  cancel: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  cancelText: { fontSize: 17, fontWeight: "700" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
});
