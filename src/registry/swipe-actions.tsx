import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface SwipeActionItem {
  label: string;
  onPress: () => void;
  /** Background of this action. Defaults to `colors.action`. */
  color?: string;
}

export interface SwipeActionsColors {
  surface: string;
  action: string;
  actionText: string;
}

const DEFAULT_COLORS: SwipeActionsColors = {
  surface: "#ffffff",
  action: "#4f46e5",
  actionText: "#ffffff",
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

export interface SwipeActionsProps {
  children: ReactNode;
  /** Buttons revealed by swiping the row to the left. */
  actions: SwipeActionItem[];
  /** Width of each revealed action. */
  actionWidth?: number;
  /** Fraction of the revealed width, or a flick this fast, that commits the swipe. */
  openThreshold?: number;
  onOpenChange?: (open: boolean) => void;
  colors?: Partial<SwipeActionsColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A list row that slides left to reveal action buttons. Follows the finger with rubber-banding at
 * both ends, springs to open or closed on release (a quick flick is enough), and exposes each action
 * to screen readers as a custom action so nothing depends on the gesture.
 */
export function SwipeActions({
  children,
  actions,
  actionWidth = 76,
  openThreshold = 0.4,
  onOpenChange,
  colors,
  style,
}: SwipeActionsProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const x = useRef(new Animated.Value(0)).current;
  const base = useRef(0);
  // True during a drag and for a moment after it: the click a mouse sends on release is not a tap.
  const dragging = useRef(false);
  const [open, setOpen] = useState(false);
  // Actions stay invisible until the row has moved, so no sliver shows past its edge at rest.
  const revealed = x.interpolate({
    inputRange: [-8, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const width = actions.length * actionWidth;
  // The responder is created once, so it reads the latest values from here.
  const live = useRef({ width, openThreshold, reduceMotion, onOpenChange });
  live.current = { width, openThreshold, reduceMotion, onOpenChange };

  const settle = (target: number, velocity = 0) => {
    base.current = target;
    const isOpen = target !== 0;
    setOpen(isOpen);
    live.current.onOpenChange?.(isOpen);
    if (live.current.reduceMotion) {
      x.setValue(target);
      return;
    }
    Animated.spring(x, {
      toValue: target,
      velocity,
      stiffness: 380,
      damping: 34,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        dragging.current = true;
        x.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const max = live.current.width;
        const raw = base.current + g.dx;
        // Past either end the row still moves, but a quarter as far.
        const next = raw > 0 ? raw / 4 : raw < -max ? -max + (raw + max) / 4 : raw;
        x.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        setTimeout(() => (dragging.current = false), 80);
        const { width: max, openThreshold: threshold } = live.current;
        const end = base.current + g.dx;
        const flickedOpen = g.vx < -0.5;
        const flickedShut = g.vx > 0.5;
        const pastThreshold = end < -max * threshold;
        settle(!flickedShut && (flickedOpen || pastThreshold) ? -max : 0, g.vx);
      },
      onPanResponderTerminate: () => {
        setTimeout(() => (dragging.current = false), 80);
        settle(base.current);
      },
    }),
  ).current;

  return (
    <View style={[styles.root, { backgroundColor: palette.surface }, style]}>
      <Animated.View
        style={[styles.actions, { width, opacity: revealed }]}
        pointerEvents={open ? "auto" : "none"}
      >
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={() => {
              action.onPress();
              settle(0);
            }}
            style={({ pressed }) => [
              styles.action,
              { width: actionWidth, backgroundColor: action.color ?? palette.action },
              pressed && styles.actionPressed,
            ]}
          >
            <Text style={[styles.actionText, { color: palette.actionText }]} numberOfLines={1}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </Animated.View>
      <Animated.View
        {...pan.panHandlers}
        accessible
        accessibilityActions={actions.map((action) => ({
          name: action.label,
          label: action.label,
        }))}
        onAccessibilityAction={(event) =>
          actions.find((action) => action.label === event.nativeEvent.actionName)?.onPress()
        }
        style={[
          styles.content,
          { backgroundColor: palette.surface, transform: [{ translateX: x }] },
        ]}
      >
        <Pressable
          disabled={!open}
          accessible={false}
          onPress={() => {
            if (!dragging.current) settle(0);
          }}
          style={styles.fill}
        >
          <View pointerEvents={open ? "none" : "auto"}>{children}</View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: "hidden" },
  actions: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
  },
  action: { alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  actionPressed: { opacity: 0.8 },
  actionText: { fontSize: 14, fontWeight: "600" },
  // userSelect keeps a mouse drag on the web from selecting the row's text instead of moving it.
  content: { width: "100%", userSelect: "none" },
  fill: { width: "100%" },
});
