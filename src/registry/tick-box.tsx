import { useEffect, useRef, useState, type ReactNode } from "react";
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

export interface TickBoxColors {
  border: string;
  fill: string;
  tick: string;
  text: string;
  description: string;
}

const DEFAULT_COLORS: TickBoxColors = {
  border: "#9ca3af",
  fill: "#4f46e5",
  tick: "#ffffff",
  text: "#111827",
  description: "#6b7280",
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

export interface TickBoxProps {
  /** Checked, unchecked, or "mixed" for a parent whose children are partly checked. */
  checked: boolean | "mixed";
  /** Called with the new state when pressed. A "mixed" box becomes checked. */
  onChange: (next: boolean) => void;
  /** Text beside the box. Pressing it toggles the box too. */
  label?: string;
  /** A second, smaller line under the label. */
  description?: string;
  /** Side of the box. */
  size?: number;
  /** Draws a circle instead of a rounded square. */
  round?: boolean;
  disabled?: boolean;
  /** Extra content shown after the label. */
  children?: ReactNode;
  colors?: Partial<TickBoxColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A checkbox whose fill pops in on a spring and whose tick grows out of its corner. It also has the
 * "mixed" state for a select-all box over partly checked children. The whole row is the touch target,
 * with the state read out as checked, unchecked or mixed.
 */
export function TickBox({
  checked,
  onChange,
  label,
  description,
  size = 24,
  round = false,
  disabled = false,
  children,
  colors,
  style,
}: TickBoxProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const on = checked === true;
  const mixed = checked === "mixed";
  const fill = useRef(new Animated.Value(on || mixed ? 1 : 0)).current;
  const tick = useRef(new Animated.Value(on ? 1 : 0)).current;
  const bar = useRef(new Animated.Value(mixed ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const to = (value: Animated.Value, toValue: number, stiffness = 380) =>
      reduceMotion
        ? value.setValue(toValue)
        : Animated.spring(value, {
            toValue,
            stiffness,
            damping: 22,
            mass: 1,
            useNativeDriver: NATIVE_DRIVER,
          }).start();
    to(fill, on || mixed ? 1 : 0);
    to(tick, on ? 1 : 0, 300);
    to(bar, mixed ? 1 : 0, 300);
  }, [on, mixed, reduceMotion, fill, tick, bar]);

  const dip = (down: boolean) => {
    if (reduceMotion) return;
    Animated.spring(press, {
      toValue: down ? 0.92 : 1,
      stiffness: 500,
      damping: 24,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  const radius = round ? size / 2 : size * 0.26;
  const stem = size * 0.5;
  const foot = size * 0.26;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: mixed ? "mixed" : on, disabled }}
      aria-checked={mixed ? "mixed" : on}
      aria-disabled={disabled}
      disabled={disabled}
      hitSlop={6}
      onPress={() => onChange(!on)}
      onPressIn={() => dip(true)}
      onPressOut={() => dip(false)}
      style={[styles.row, disabled && styles.disabled, style]}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth: 2,
          borderColor: on || mixed ? palette.fill : palette.border,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale: press }],
        }}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: Math.max(0, radius - 2),
              backgroundColor: palette.fill,
              opacity: fill,
              transform: [
                { scale: fill.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={{
            width: foot,
            height: stem,
            marginTop: -size * 0.06,
            borderRightWidth: 2.5,
            borderBottomWidth: 2.5,
            borderColor: palette.tick,
            opacity: tick,
            transform: [
              { rotate: "45deg" },
              { scale: tick.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
            ],
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            width: size * 0.5,
            height: 2.5,
            borderRadius: 2,
            backgroundColor: palette.tick,
            opacity: bar,
            transform: [{ scaleX: bar.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }],
          }}
        />
      </Animated.View>
      {label || description || children ? (
        <View style={styles.text}>
          {label ? <Text style={[styles.label, { color: palette.text }]}>{label}</Text> : null}
          {description ? (
            <Text style={[styles.description, { color: palette.description }]}>{description}</Text>
          ) : null}
          {children}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    minHeight: 44,
    paddingVertical: 8,
    userSelect: "none",
  },
  text: { flex: 1, gap: 2 },
  label: { fontSize: 16, fontWeight: "600", lineHeight: 24 },
  description: { fontSize: 13, lineHeight: 18 },
  disabled: { opacity: 0.45 },
});
