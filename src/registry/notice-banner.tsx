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
const SWIPE_AWAY = 90;

export type NoticeTone = "info" | "success" | "warning" | "error";

export interface NoticeBannerColors {
  info: string;
  success: string;
  warning: string;
  error: string;
  surface: string;
  title: string;
  message: string;
}

const DEFAULT_COLORS: NoticeBannerColors = {
  info: "#2563eb",
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
  surface: "#ffffff",
  title: "#111827",
  message: "#4b5563",
};

const GLYPH: Record<NoticeTone, string> = { info: "i", success: "✓", warning: "!", error: "×" };

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

export interface NoticeBannerProps {
  title: string;
  message?: string;
  tone?: NoticeTone;
  /** Shows or hides the banner. It slides in and collapses out, so the content below follows smoothly. */
  visible?: boolean;
  /** When given, the banner shows a close button and can be swiped away. */
  onDismiss?: () => void;
  /** A button under the message, for example "Undo" or "View". */
  action?: { label: string; onPress: () => void };
  colors?: Partial<NoticeBannerColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * An inline alert in one of four tones. It slides in and collapses its height on the way out, so the
 * content below follows smoothly, and with `onDismiss` it can be closed with a button or swiped
 * sideways. Errors and warnings are announced at once; the other tones wait politely.
 */
export function NoticeBanner({
  title,
  message,
  tone = "info",
  visible = true,
  onDismiss,
  action,
  colors,
  style,
}: NoticeBannerProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [shown, setShown] = useState(visible);
  const [mounted, setMounted] = useState(visible);
  const [height, setHeight] = useState(0);
  const t = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const x = useRef(new Animated.Value(0)).current;
  // True during a drag and for a moment after it: the click a mouse sends on release is not a tap.
  const dragging = useRef(false);

  const live = useRef({ onDismiss, reduceMotion });
  live.current = { onDismiss, reduceMotion };

  // Follow the `visible` prop.
  useEffect(() => setShown(visible), [visible]);

  useEffect(() => {
    if (shown) setMounted(true);
    x.setValue(0);
    if (reduceMotion) {
      t.setValue(shown ? 1 : 0);
      if (!shown) setMounted(false);
      return;
    }
    Animated.timing(t, {
      toValue: shown ? 1 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !shown) setMounted(false);
    });
  }, [shown, reduceMotion, t, x]);

  const dismiss = () => {
    setShown(false);
    live.current.onDismiss?.();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        !!live.current.onDismiss && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        dragging.current = true;
      },
      onPanResponderMove: (_, g) => x.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        setTimeout(() => (dragging.current = false), 80);
        if (Math.abs(g.dx) > SWIPE_AWAY || Math.abs(g.vx) > 0.8) {
          dismiss();
          return;
        }
        if (live.current.reduceMotion) x.setValue(0);
        else
          Animated.spring(x, {
            toValue: 0,
            stiffness: 360,
            damping: 28,
            mass: 1,
            useNativeDriver: NATIVE_DRIVER,
          }).start();
      },
      onPanResponderTerminate: () => {
        setTimeout(() => (dragging.current = false), 80);
        x.setValue(0);
      },
    }),
  ).current;

  if (!mounted) return null;

  const accent = palette[tone];
  const urgent = tone === "error" || tone === "warning";

  return (
    <Animated.View
      style={{
        height:
          height > 0 ? t.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) : undefined,
        opacity: t,
        overflow: "hidden",
      }}
    >
      <View onLayout={(event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height)}>
        <Animated.View
          {...pan.panHandlers}
          role={urgent ? "alert" : "status"}
          accessibilityLiveRegion={urgent ? "assertive" : "polite"}
          aria-live={urgent ? "assertive" : "polite"}
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: accent,
              transform: [{ translateX: x }],
            },
            style,
          ]}
        >
          <View style={[styles.glyph, { backgroundColor: accent }]} accessible={false}>
            <Text style={styles.glyphText}>{GLYPH[tone]}</Text>
          </View>
          <View style={styles.body}>
            <Text style={[styles.title, { color: palette.title }]}>{title}</Text>
            {message ? (
              <Text style={[styles.message, { color: palette.message }]}>{message}</Text>
            ) : null}
            {action ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  if (!dragging.current) action.onPress();
                }}
                style={({ pressed }) => [styles.action, pressed && styles.dim]}
              >
                <Text style={[styles.actionText, { color: accent }]}>{action.label}</Text>
              </Pressable>
            ) : null}
          </View>
          {onDismiss ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              hitSlop={12}
              onPress={() => {
                if (!dragging.current) dismiss();
              }}
              style={({ pressed }) => [styles.close, pressed && styles.dim]}
            >
              <Text style={[styles.closeText, { color: palette.message }]}>×</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    userSelect: "none",
  },
  glyph: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  glyphText: { color: "#ffffff", fontSize: 14, fontWeight: "800", lineHeight: 18 },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "700", lineHeight: 22 },
  message: { fontSize: 14, lineHeight: 20 },
  action: { alignSelf: "flex-start", minHeight: 32, justifyContent: "center", marginTop: 4 },
  actionText: { fontSize: 14, fontWeight: "700" },
  close: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 22, lineHeight: 24 },
  dim: { opacity: 0.6 },
});
