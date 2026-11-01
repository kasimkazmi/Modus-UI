import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const MAX_VISIBLE = 3;
// Each toast behind the front one sits this much smaller and further from the edge.
const DEPTH_SCALE = 0.05;
const DEPTH_SHIFT = 10;

type Tone = "default" | "success" | "error";
type Exit = "left" | "right" | "edge";

export interface FlickToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: Tone;
}

export interface FlickToastColors {
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
  success: string;
  error: string;
}

const DEFAULT_COLORS: FlickToastColors = {
  surface: "#111827",
  text: "#ffffff",
  mutedText: "#d1d5db",
  border: "rgba(255, 255, 255, 0.12)",
  accent: "#818cf8",
  success: "#22c55e",
  error: "#ef4444",
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

export interface FlickToastProps {
  /** The toasts to show, oldest first. The host owns the list: remove a toast in `onDismiss`. */
  toasts: FlickToastItem[];
  /** Called once a toast has left, whether it timed out, was flicked away or dismissed by a screen reader. */
  onDismiss: (id: string) => void;
  /** Milliseconds the front toast stays before it leaves. 0 keeps toasts until they are dismissed. */
  duration?: number;
  /** Which edge the stack sits against. */
  position?: "top" | "bottom";
  colors?: Partial<FlickToastColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A stack of toasts you flick away. The newest slides in at the front with the older ones scaled back
 * behind it, a thin line counts down the front toast's time (and waits while you hold it), and a
 * sideways or toward-the-edge flick sends it off. Draws inside its parent, which must fill the area
 * the toasts should float over. Each toast is a live region with a dismiss action for screen readers.
 */
export function FlickToast({
  toasts,
  onDismiss,
  duration = 4000,
  position = "top",
  colors,
  style,
}: FlickToastProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  // Newest first, so a toast's index is its depth in the stack.
  const visible = toasts.slice(-MAX_VISIBLE).reverse();

  return (
    <View pointerEvents="box-none" style={[styles.root, style]}>
      {/* The front toast is drawn last, so it sits above the rest. */}
      {[...visible].reverse().map((item) => (
        <ToastCard
          key={item.id}
          item={item}
          depth={visible.indexOf(item)}
          position={position}
          duration={duration}
          colors={palette}
          reduceMotion={reduceMotion}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
}

interface ToastCardProps {
  item: FlickToastItem;
  depth: number;
  position: "top" | "bottom";
  duration: number;
  colors: FlickToastColors;
  reduceMotion: boolean;
  onDismiss: (id: string) => void;
}

function ToastCard({
  item,
  depth,
  position,
  duration,
  colors,
  reduceMotion,
  onDismiss,
}: ToastCardProps) {
  // -1 when the edge is up (top), 1 when it is down (bottom): the direction "toward the edge".
  const edge = position === "top" ? -1 : 1;
  const enter = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const stack = useRef(new Animated.Value(depth)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  // 1 to 0 over `duration`. Driven from JS so its current level can be read when paused.
  const remaining = useRef(new Animated.Value(1)).current;
  const level = useRef(1);
  const size = useRef({ width: 360, height: 72 });
  const leaving = useRef(false);
  const holding = useRef(false);
  const isFront = depth === 0;
  const live = useRef({ duration, edge, reduceMotion, onDismiss, isFront });
  live.current = { duration, edge, reduceMotion, onDismiss, isFront };

  useEffect(() => {
    const id = remaining.addListener(({ value }) => (level.current = value));
    return () => remaining.removeListener(id);
  }, [remaining]);

  useEffect(() => {
    if (!live.current.reduceMotion) {
      Animated.spring(enter, {
        toValue: 1,
        stiffness: 300,
        damping: 24,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }).start();
    }
  }, [enter]);

  useEffect(() => {
    if (reduceMotion) {
      stack.setValue(depth);
      return;
    }
    Animated.spring(stack, {
      toValue: depth,
      stiffness: 320,
      damping: 26,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [depth, reduceMotion, stack]);

  const run = () => {
    const total = live.current.duration;
    if (total <= 0 || leaving.current || holding.current) return;
    Animated.timing(remaining, {
      toValue: 0,
      duration: total * level.current,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) leave("edge");
    });
  };

  const leave = (exit: Exit) => {
    if (leaving.current) return;
    leaving.current = true;
    remaining.stopAnimation();
    const { edge: toward, reduceMotion: reduce, onDismiss: done } = live.current;
    if (reduce) {
      done(item.id);
      return;
    }
    const { width, height } = size.current;
    const move =
      exit === "edge"
        ? Animated.timing(y, {
            toValue: toward * (height + 80),
            duration: 220,
            useNativeDriver: NATIVE_DRIVER,
          })
        : Animated.timing(x, {
            toValue: (exit === "right" ? 1 : -1) * (width + 60),
            duration: 220,
            useNativeDriver: NATIVE_DRIVER,
          });
    Animated.parallel([
      move,
      Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: NATIVE_DRIVER }),
    ]).start(() => done(item.id));
  };

  // The countdown belongs to the front toast; one pushed behind keeps the time it has left.
  useEffect(() => {
    if (isFront) run();
    return () => remaining.stopAnimation();
    // run reads everything through refs, so it only needs to start when the toast reaches the front.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFront, duration]);

  const springBack = () => {
    holding.current = false;
    if (live.current.reduceMotion) {
      x.setValue(0);
      y.setValue(0);
    } else {
      const back = (value: Animated.Value) =>
        Animated.spring(value, {
          toValue: 0,
          stiffness: 360,
          damping: 28,
          mass: 1,
          useNativeDriver: NATIVE_DRIVER,
        });
      Animated.parallel([back(x), back(y)]).start();
    }
    if (live.current.isFront) run();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Holding a toast stops its clock.
        holding.current = true;
        remaining.stopAnimation();
        x.stopAnimation();
        y.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        x.setValue(g.dx);
        // Toward the edge it follows the finger; the other way it resists.
        y.setValue(g.dy * live.current.edge > 0 ? g.dy : g.dy / 5);
      },
      onPanResponderRelease: (_, g) => {
        const toward = g.dy * live.current.edge;
        const towardSpeed = g.vy * live.current.edge;
        const sideways = Math.abs(g.dx) > 90 || (Math.abs(g.vx) > 0.8 && g.dx * g.vx > 0);
        if (sideways) {
          holding.current = false;
          leave(g.dx > 0 ? "right" : "left");
        } else if (toward > 40 || towardSpeed > 0.7) {
          holding.current = false;
          leave("edge");
        } else {
          springBack();
        }
      },
      onPanResponderTerminate: () => springBack(),
    }),
  ).current;

  const tone = item.tone ?? "default";
  const toneColor =
    tone === "success" ? colors.success : tone === "error" ? colors.error : colors.accent;

  const enterShift = enter.interpolate({ inputRange: [0, 1], outputRange: [edge * 28, 0] });
  const stackShift = stack.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, -edge * DEPTH_SHIFT, -edge * DEPTH_SHIFT * 2],
  });
  const scale = stack.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [1, 1 - DEPTH_SCALE, 1 - DEPTH_SCALE * 2],
  });
  const stackOpacity = stack.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 0.85, 0.7] });
  const tilt = reduceMotion
    ? "0deg"
    : x.interpolate({ inputRange: [-300, 0, 300], outputRange: ["-6deg", "0deg", "6deg"] });

  return (
    <Animated.View
      {...pan.panHandlers}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion={tone === "error" ? "assertive" : "polite"}
      accessibilityLabel={item.description ? `${item.title}. ${item.description}` : item.title}
      accessibilityActions={[{ name: "dismiss", label: "Dismiss" }]}
      onAccessibilityAction={() => leave("edge")}
      onLayout={(event: LayoutChangeEvent) => (size.current = event.nativeEvent.layout)}
      pointerEvents={isFront ? "auto" : "none"}
      style={[
        styles.card,
        position === "top" ? styles.atTop : styles.atBottom,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: Animated.multiply(Animated.multiply(enter, stackOpacity), fade),
          transform: [
            { translateX: x },
            { translateY: Animated.add(Animated.add(enterShift, stackShift), y) },
            { rotate: tilt },
            { scale },
          ],
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: toneColor }]} />
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {item.title}
          </Text>
          {item.description ? (
            <Text numberOfLines={2} style={[styles.description, { color: colors.mutedText }]}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
      {duration > 0 ? (
        <View pointerEvents="none" style={styles.track}>
          <Animated.View
            style={[
              styles.line,
              { backgroundColor: toneColor, transform: [{ scaleX: remaining }] },
            ]}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  // userSelect keeps a mouse drag on the web from selecting the text instead of moving the toast.
  card: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    userSelect: "none",
    boxShadow: "0 10px 28px rgba(0, 0, 0, 0.28)",
  },
  atTop: { top: 16 },
  atBottom: { bottom: 16 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 13, lineHeight: 18 },
  track: { height: 3, width: "100%" },
  line: { height: 3, width: "100%", transformOrigin: "left", opacity: 0.9 },
});
