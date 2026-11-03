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

export interface EmptyStateColors {
  badge: string;
  title: string;
  message: string;
  button: string;
  buttonText: string;
}

const DEFAULT_COLORS: EmptyStateColors = {
  badge: "#eef2ff",
  title: "#111827",
  message: "#6b7280",
  button: "#4f46e5",
  buttonText: "#ffffff",
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

export interface EmptyStateProps {
  title: string;
  message?: string;
  /** A single glyph or emoji drawn in the badge. */
  icon?: string;
  /** Label of the button under the message; leave it out for no button. */
  actionLabel?: string;
  onAction?: () => void;
  colors?: Partial<EmptyStateColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * What to show when a list has nothing in it yet. A badge with a glyph floats gently above a title,
 * a short message and an optional button, and the whole block rises into place when it appears.
 * With reduced motion it appears already in place and the badge stays still.
 */
export function EmptyState({
  title,
  message,
  icon = "📭",
  actionLabel,
  onAction,
  colors,
  style,
}: EmptyStateProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const enter = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      enter.setValue(1);
      bob.setValue(0);
      return;
    }
    Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE_DRIVER,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, enter, bob]);

  return (
    <Animated.View
      accessible
      accessibilityLabel={message ? `${title}. ${message}` : title}
      style={[
        styles.root,
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.badge,
          {
            backgroundColor: palette.badge,
            transform: [
              { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
            ],
          },
        ]}
      >
        <Text style={styles.icon}>{icon}</Text>
      </Animated.View>
      <Text style={[styles.title, { color: palette.title }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: palette.message }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: palette.button, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: palette.buttonText }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", gap: 8, paddingHorizontal: 24 },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  icon: { fontSize: 40 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  message: { fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 280 },
  button: {
    marginTop: 12,
    minHeight: 46,
    paddingHorizontal: 24,
    borderRadius: 14,
    justifyContent: "center",
    userSelect: "none",
  },
  buttonText: { fontSize: 15, fontWeight: "700" },
});
