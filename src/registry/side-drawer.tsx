import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
// Width of the strip along the edge that a swipe can start from.
const EDGE = 22;

export interface SideDrawerColors {
  surface: string;
  backdrop: string;
  border: string;
}

const DEFAULT_COLORS: SideDrawerColors = {
  surface: "#ffffff",
  backdrop: "rgba(0, 0, 0, 0.45)",
  border: "#e5e7eb",
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

export interface SideDrawerProps {
  open: boolean;
  /** Called when the drawer is closed by a backdrop tap, a drag or Escape on the web. */
  onClose: () => void;
  /** Called when a swipe from the screen edge pulls it open. Without it the edge swipe is off. */
  onOpen?: () => void;
  /** Which edge the drawer comes from. */
  side?: "left" | "right";
  /** Width of the panel. */
  width?: number;
  /** Spoken name of the drawer. */
  label?: string;
  children: ReactNode;
  colors?: Partial<SideDrawerColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A panel that slides in from the left or right edge of its parent. Drag it toward its edge to close
 * it, tap the backdrop, or press Escape on the web. Give it `onOpen` and a swipe that starts at the
 * screen edge pulls it open, following your finger. Draw it inside the screen it belongs to, so the
 * parent must fill that screen.
 */
export function SideDrawer({
  open,
  onClose,
  onOpen,
  side = "left",
  width = 280,
  label = "Menu",
  children,
  colors,
  style,
}: SideDrawerProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  // 0 is closed, 1 is open, and a drag sets it anywhere between.
  const p = useRef(new Animated.Value(open ? 1 : 0)).current;
  const current = useRef(open ? 1 : 0);
  const sign = side === "left" ? -1 : 1;

  const live = useRef({ open, onClose, onOpen, width, reduceMotion, sign });
  live.current = { open, onClose, onOpen, width, reduceMotion, sign };

  const animateTo = (target: 0 | 1, velocity = 0) => {
    current.current = target;
    if (live.current.reduceMotion) {
      p.setValue(target);
      return;
    }
    Animated.spring(p, {
      toValue: target,
      velocity,
      stiffness: 320,
      damping: 32,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  useEffect(() => {
    animateTo(open ? 1 : 0);
    // animateTo reads everything through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reduceMotion]);

  // Escape closes it on the web.
  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") live.current.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const settle = (progress: number, vx: number, wasOpen: boolean) => {
    const { sign: dir, width: w } = live.current;
    // Velocity toward the open direction (positive) or away from it (negative), in progress per ms.
    const along = (vx * -dir) / w;
    const target: 0 | 1 = along > 0.0015 ? 1 : along < -0.0015 ? 0 : progress > 0.5 ? 1 : 0;
    animateTo(target, along * 1000);
    if (target === 1 && !wasOpen) live.current.onOpen?.();
    if (target === 0 && wasOpen) live.current.onClose();
  };

  // Drag the open panel toward its edge to close it.
  const closeDrag = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        live.current.open && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => p.stopAnimation(),
      onPanResponderMove: (_, g) => {
        const { sign: dir, width: w } = live.current;
        p.setValue(Math.max(0, Math.min(1, 1 + (g.dx * dir) / w)));
      },
      onPanResponderRelease: (_, g) => {
        const { sign: dir, width: w } = live.current;
        settle(Math.max(0, Math.min(1, 1 + (g.dx * dir) / w)), g.vx, true);
      },
      onPanResponderTerminate: () => animateTo(live.current.open ? 1 : 0),
    }),
  ).current;

  // A swipe from the screen edge pulls the closed panel open.
  const edgeDrag = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !live.current.open && !!live.current.onOpen,
      onMoveShouldSetPanResponder: (_, g) =>
        !live.current.open &&
        !!live.current.onOpen &&
        Math.abs(g.dx) > 4 &&
        Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => p.stopAnimation(),
      onPanResponderMove: (_, g) => {
        const { sign: dir, width: w } = live.current;
        p.setValue(Math.max(0, Math.min(1, (g.dx * -dir) / w)));
      },
      onPanResponderRelease: (_, g) => {
        const { sign: dir, width: w } = live.current;
        settle(Math.max(0, Math.min(1, (g.dx * -dir) / w)), g.vx, false);
      },
      onPanResponderTerminate: () => animateTo(0),
    }),
  ).current;

  const translateX = p.interpolate({ inputRange: [0, 1], outputRange: [sign * width, 0] });

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View
        aria-hidden
        pointerEvents={open ? "auto" : "none"}
        style={[styles.fill, { backgroundColor: palette.backdrop, opacity: p }]}
      >
        <Pressable accessible={false} onPress={onClose} style={styles.fill} />
      </Animated.View>
      {!open && onOpen ? (
        <View
          {...edgeDrag.panHandlers}
          style={[styles.edge, side === "left" ? { left: 0 } : { right: 0 }]}
        />
      ) : null}
      <Animated.View
        {...closeDrag.panHandlers}
        role="dialog"
        aria-modal={open}
        aria-label={label}
        aria-hidden={!open}
        accessibilityLabel={label}
        accessibilityViewIsModal={open}
        importantForAccessibility={open ? "yes" : "no-hide-descendants"}
        style={[
          styles.panel,
          side === "left" ? { left: 0 } : { right: 0 },
          {
            width,
            backgroundColor: palette.surface,
            borderColor: palette.border,
            [side === "left" ? "borderRightWidth" : "borderLeftWidth"]: StyleSheet.hairlineWidth,
            transform: [{ translateX }],
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  edge: { position: "absolute", top: 0, bottom: 0, width: EDGE },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    userSelect: "none",
    boxShadow: "0 0 40px rgba(0, 0, 0, 0.25)",
  },
});
