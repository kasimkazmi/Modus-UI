import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface CountBadgeColors {
  badge: string;
  text: string;
  ring: string;
}

const DEFAULT_COLORS: CountBadgeColors = {
  badge: "#dc2626",
  text: "#ffffff",
  ring: "#ffffff",
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

export interface CountBadgeProps {
  /** The number to show. */
  count: number;
  /** Counts above this show as "max+", for example "99+". */
  max?: number;
  /** Shows a small dot instead of the number. */
  dot?: boolean;
  /** Hides the badge when the count is zero. */
  hideZero?: boolean;
  /** What is being counted, for example "Notifications". Read out with the number. */
  label?: string;
  /** The icon or avatar the badge sits on the corner of. */
  children?: ReactNode;
  colors?: Partial<CountBadgeColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A count bubble that sits on the corner of an icon. It pops in when the count first appears, pulses
 * each time the number changes, and shrinks away when it returns to zero. Large counts read "99+",
 * and the label and number are read out together.
 */
export function CountBadge({
  count,
  max = 99,
  dot = false,
  hideZero = true,
  label = "Notifications",
  children,
  colors,
  style,
}: CountBadgeProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const visible = !(hideZero && count <= 0);
  const show = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const previous = useRef(count);

  useEffect(() => {
    if (reduceMotion) {
      show.setValue(visible ? 1 : 0);
      return;
    }
    Animated.spring(show, {
      toValue: visible ? 1 : 0,
      stiffness: 420,
      damping: 18,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [visible, reduceMotion, show]);

  // Each change in the number gives the badge a small bump.
  useEffect(() => {
    if (previous.current === count) return;
    previous.current = count;
    if (reduceMotion || !visible) return;
    pulse.setValue(1.35);
    Animated.spring(pulse, {
      toValue: 1,
      stiffness: 380,
      damping: 12,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [count, visible, reduceMotion, pulse]);

  const text = count > max ? `${max}+` : String(count);
  const spoken = `${label}, ${visible ? (count > max ? `more than ${max}` : count) : "none"}`;

  return (
    <View
      accessible
      accessibilityLabel={spoken}
      aria-label={spoken}
      accessibilityLiveRegion="polite"
      style={[styles.anchor, style]}
    >
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          dot ? styles.dot : styles.badge,
          {
            backgroundColor: palette.badge,
            borderColor: palette.ring,
            opacity: show,
            transform: [{ scale: Animated.multiply(show, pulse) }],
          },
        ]}
      >
        {dot ? null : <Text style={[styles.text, { color: palette.text }]}>{text}</Text>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { alignSelf: "flex-start" },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  text: { fontSize: 11, fontWeight: "800", lineHeight: 14 },
});
