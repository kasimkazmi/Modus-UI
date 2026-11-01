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
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface SnapSheetColors {
  surface: string;
  handle: string;
  title: string;
  backdrop: string;
}

const DEFAULT_COLORS: SnapSheetColors = {
  surface: "#ffffff",
  handle: "#c7c7cc",
  title: "#111827",
  backdrop: "rgba(0, 0, 0, 0.45)",
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

export interface SnapSheetProps {
  /** Whether the sheet is showing. Dragging it below the lowest stop calls `onClose`. */
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Visible height at each stop, as a fraction of the container, lowest first. */
  snapPoints?: number[];
  /** Index into `snapPoints` the sheet opens at. */
  initialSnap?: number;
  onSnapChange?: (index: number) => void;
  colors?: Partial<SnapSheetColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A bottom sheet with snap points, drawn inside its parent so it works in a screen, a tab or a
 * Modal alike (the parent must fill the area the sheet should cover). Drag the handle: release
 * picks the nearest stop, a flick carries it to the next one, and pulling past the lowest stop
 * dismisses. The handle is also an adjustable control for screen readers.
 */
export function SnapSheet({
  open,
  onClose,
  children,
  title,
  snapPoints = [0.4, 0.9],
  initialSnap = 0,
  onSnapChange,
  colors,
  style,
}: SnapSheetProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [height, setHeight] = useState(0);
  const [snap, setSnap] = useState(initialSnap);
  const y = useRef(new Animated.Value(0)).current;
  const base = useRef(0);

  const stops = [...snapPoints].sort((a, b) => a - b);
  const sheetHeight = height * stops[stops.length - 1];
  // translateY of each stop (0 = fully raised), then the hidden position last.
  const offsets = stops.map((fraction) => height * (stops[stops.length - 1] - fraction));
  const hidden = sheetHeight;

  const live = useRef({ offsets, hidden, reduceMotion, onClose, onSnapChange });
  live.current = { offsets, hidden, reduceMotion, onClose, onSnapChange };

  const moveTo = (target: number, velocity = 0) => {
    base.current = target;
    if (live.current.reduceMotion) {
      y.setValue(target);
      return;
    }
    Animated.spring(y, {
      toValue: target,
      velocity,
      stiffness: 320,
      damping: 32,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  const goToSnap = (index: number, velocity = 0) => {
    const clamped = Math.max(0, Math.min(live.current.offsets.length - 1, index));
    setSnap(clamped);
    live.current.onSnapChange?.(clamped);
    moveTo(live.current.offsets[clamped], velocity);
  };

  useEffect(() => {
    if (height === 0) return;
    if (open) goToSnap(initialSnap);
    else moveTo(hidden);
    // goToSnap and moveTo read everything through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, height]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => y.stopAnimation(),
      onPanResponderMove: (_, g) => {
        const { offsets: o, hidden: h } = live.current;
        const raw = base.current + g.dy;
        // Stretch a quarter as far above the top stop; follow the finger everywhere else.
        y.setValue(raw < o[0] ? o[0] + (raw - o[0]) / 4 : Math.min(raw, h));
      },
      onPanResponderRelease: (_, g) => {
        const { offsets: o, hidden: h, onClose: close } = live.current;
        const end = base.current + g.dy;
        // Project where a flick would land, then take the closest stop (or the hidden position).
        const projected = end + g.vy * 120;
        const candidates = [...o, h];
        const nearest = candidates.reduce(
          (best, offset, index) =>
            Math.abs(offset - projected) < Math.abs(candidates[best] - projected) ? index : best,
          0,
        );
        if (nearest === o.length) {
          moveTo(h, g.vy);
          close();
        } else {
          goToSnap(nearest, g.vy);
        }
      },
    }),
  ).current;

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (next !== height) {
      if (height === 0) y.setValue(next * stops[stops.length - 1]);
      setHeight(next);
    }
  };

  const backdropOpacity = y.interpolate({
    inputRange: [offsets[0] ?? 0, hidden || 1],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" onLayout={onLayout}>
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: palette.backdrop, opacity: backdropOpacity },
        ]}
      >
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal={open}
        pointerEvents={open ? "auto" : "none"}
        style={[
          styles.sheet,
          { height: sheetHeight, backgroundColor: palette.surface, transform: [{ translateY: y }] },
          style,
        ]}
      >
        <View
          {...pan.panHandlers}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={title ?? "Sheet"}
          accessibilityValue={{ text: `Stop ${snap + 1} of ${stops.length}` }}
          aria-valuetext={`Stop ${snap + 1} of ${stops.length}`}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(event) =>
            goToSnap(snap + (event.nativeEvent.actionName === "increment" ? 1 : -1))
          }
          style={styles.grab}
        >
          <View style={[styles.handle, { backgroundColor: palette.handle }]} />
          {title ? <Text style={[styles.title, { color: palette.title }]}>{title}</Text> : null}
        </View>
        <View style={styles.body}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.18)",
  },
  // userSelect keeps a mouse drag on the web from selecting the title instead of moving the sheet.
  grab: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 20,
    userSelect: "none",
  },
  handle: { width: 40, height: 5, borderRadius: 3 },
  title: { marginTop: 14, alignSelf: "flex-start", fontSize: 18, fontWeight: "700" },
  body: { flex: 1, paddingHorizontal: 20 },
});
