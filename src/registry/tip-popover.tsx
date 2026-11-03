import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
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
const WIDTH = 220;
const GAP = 10;

export interface TipPopoverColors {
  background: string;
  text: string;
}

const DEFAULT_COLORS: TipPopoverColors = {
  background: "#111827",
  text: "#ffffff",
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

export interface TipPopoverProps {
  open: boolean;
  onClose: () => void;
  /** The tip's text. */
  content: string;
  /** The element the tip points at. */
  children: ReactNode;
  /** Which side of the trigger the tip opens on. */
  placement?: "top" | "bottom";
  colors?: Partial<TipPopoverColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A small tip that points at its trigger. It is drawn inside its parent rather than in a Modal, so it
 * stays within a screen, and it springs out from the arrow. Tapping anywhere else closes it, and on
 * the web so does Escape. The tip is announced when it opens.
 */
export function TipPopover({
  open,
  onClose,
  content,
  children,
  placement = "top",
  colors,
  style,
}: TipPopoverProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const t = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(open);
  const [triggerWidth, setTriggerWidth] = useState(0);
  const top = placement === "top";

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
      damping: 26,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open, reduceMotion, t]);

  useEffect(() => {
    if (open) AccessibilityInfo.announceForAccessibility(content);
  }, [open, content]);

  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") live.current.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <View style={[styles.root, style]}>
      <View
        onLayout={(event: LayoutChangeEvent) => setTriggerWidth(event.nativeEvent.layout.width)}
      >
        {children}
      </View>
      {mounted ? (
        <>
          {open ? <Pressable accessible={false} onPress={onClose} style={styles.backdrop} /> : null}
          <Animated.View
            role="tooltip"
            accessibilityLiveRegion="polite"
            pointerEvents="none"
            style={[
              styles.holder,
              top ? { bottom: "100%", marginBottom: GAP } : { top: "100%", marginTop: GAP },
              {
                left: (triggerWidth - WIDTH) / 2,
                opacity: t,
                transform: [
                  {
                    translateY: t.interpolate({
                      inputRange: [0, 1],
                      outputRange: [top ? 6 : -6, 0],
                    }),
                  },
                  { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                ],
              },
            ]}
          >
            {!top ? (
              <View
                style={[styles.arrow, styles.arrowTop, { backgroundColor: palette.background }]}
              />
            ) : null}
            <View style={[styles.bubble, { backgroundColor: palette.background }]}>
              <Text style={[styles.text, { color: palette.text }]}>{content}</Text>
            </View>
            {top ? (
              <View
                style={[styles.arrow, styles.arrowBottom, { backgroundColor: palette.background }]}
              />
            ) : null}
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: "flex-start", position: "relative" },
  // Large enough to catch a tap anywhere on the screen around the trigger.
  backdrop: { position: "absolute", top: -2000, left: -2000, width: 4400, height: 4400 },
  holder: { position: "absolute", width: WIDTH, alignItems: "center", zIndex: 10 },
  bubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  text: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  arrow: { width: 12, height: 12, transform: [{ rotate: "45deg" }] },
  arrowBottom: { marginTop: -6 },
  arrowTop: { marginBottom: -6 },
});
