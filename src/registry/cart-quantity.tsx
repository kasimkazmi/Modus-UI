import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface CartQuantityColors {
  surface: string;
  border: string;
  text: string;
  accent: string;
  remove: string;
}

const DEFAULT_COLORS: CartQuantityColors = {
  surface: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  accent: "#4f46e5",
  remove: "#dc2626",
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

export interface CartQuantityProps {
  value: number;
  onChange: (value: number) => void;
  /** Called when minus is pressed at 1; the minus then shows a bin. Leave it out to stop at 1. */
  onRemove?: () => void;
  /** The most that can be ordered. */
  max?: number;
  /** Spoken name of the item. */
  label?: string;
  colors?: Partial<CartQuantityColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A quantity picker for a cart line. At one, the minus becomes a bin so the same tap removes the item
 * instead of going to zero. The number pops when it changes and the plus dims at the limit. Each
 * button names the item it changes, and the new quantity is announced.
 */
export function CartQuantity({
  value,
  onChange,
  onRemove,
  max = 99,
  label = "item",
  colors,
  style,
}: CartQuantityProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  const removing = value <= 1 && !!onRemove;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) return;
    pop.setValue(1.3);
    Animated.spring(pop, {
      toValue: 1,
      stiffness: 400,
      damping: 16,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [value, reduceMotion, pop]);

  const decrease = () => (removing ? onRemove?.() : value > 1 && onChange(value - 1));
  const button = (
    text: string,
    name: string,
    onPress: () => void,
    disabled: boolean,
    tint: string,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ disabled }}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 }]}
    >
      <Text style={[styles.glyph, { color: tint }]}>{text}</Text>
    </Pressable>
  );

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: palette.surface, borderColor: palette.border },
        style,
      ]}
    >
      {removing
        ? button("🗑", `Remove ${label}`, decrease, false, palette.remove)
        : button("−", `Decrease ${label} quantity`, decrease, value <= 1, palette.accent)}
      <Animated.Text
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Quantity ${value}`}
        style={[styles.value, { color: palette.text, transform: [{ scale: pop }] }]}
      >
        {value}
      </Animated.Text>
      {button(
        "+",
        `Increase ${label} quantity`,
        () => onChange(Math.min(max, value + 1)),
        value >= max,
        palette.accent,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 14,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
  },
  glyph: { fontSize: 22, fontWeight: "600" },
  value: { minWidth: 32, textAlign: "center", fontSize: 17, fontWeight: "700" },
});
