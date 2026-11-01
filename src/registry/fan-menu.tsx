import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const ITEM_SIZE = 46;

export interface FanMenuItem {
  /** Spoken label, since the button shows only its icon. */
  label: string;
  icon: ReactNode;
  onPress: () => void;
}

export interface FanMenuColors {
  button: string;
  bar: string;
  item: string;
}

const DEFAULT_COLORS: FanMenuColors = {
  button: "#4f46e5",
  bar: "#ffffff",
  item: "#ffffff",
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

export interface FanMenuProps {
  items: FanMenuItem[];
  /** Spoken label of the main button. */
  label?: string;
  /** Diameter of the main button. */
  size?: number;
  /** Distance from the main button to each item. */
  radius?: number;
  /** Where the fan starts, in degrees: 0 is right, 90 down, 180 left, 270 up. */
  startAngle?: number;
  /** Where the fan ends, in degrees. */
  endAngle?: number;
  colors?: Partial<FanMenuColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A floating button that fans its actions out along an arc. The items spring out one after another,
 * the plus turns into a cross, and picking an item folds the fan away. Place it with `style`; the
 * items are positioned from the button, so keep room for the arc on that side.
 */
export function FanMenu({
  items,
  label = "Actions",
  size = 58,
  radius = 104,
  startAngle = 180,
  endAngle = 270,
  colors,
  style,
}: FanMenuProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [open, setOpen] = useState(false);
  const progress = useRef(items.map(() => new Animated.Value(0))).current;
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = open ? 1 : 0;
    if (reduceMotion) {
      progress.forEach((value) => value.setValue(target));
      turn.setValue(target);
      return;
    }
    Animated.parallel([
      Animated.spring(turn, {
        toValue: target,
        stiffness: 300,
        damping: 22,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.stagger(
        45,
        (open ? progress : [...progress].reverse()).map((value) =>
          Animated.spring(value, {
            toValue: target,
            stiffness: 260,
            damping: 17,
            mass: 1,
            useNativeDriver: NATIVE_DRIVER,
          }),
        ),
      ),
    ]).start();
  }, [open, reduceMotion, progress, turn]);

  const spread = items.length > 1 ? (endAngle - startAngle) / (items.length - 1) : 0;
  const first = items.length > 1 ? startAngle : (startAngle + endAngle) / 2;

  return (
    <View style={[{ width: size, height: size }, style]}>
      {items.map((item, i) => {
        const radians = ((first + spread * i) * Math.PI) / 180;
        const value = progress[i];
        return (
          <Animated.View
            key={item.label}
            pointerEvents={open ? "auto" : "none"}
            style={[
              styles.item,
              {
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                borderRadius: ITEM_SIZE / 2,
                left: (size - ITEM_SIZE) / 2,
                top: (size - ITEM_SIZE) / 2,
                backgroundColor: palette.item,
                opacity: value.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
                transform: [
                  {
                    translateX: value.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.cos(radians) * radius],
                    }),
                  },
                  {
                    translateY: value.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.sin(radians) * radius],
                    }),
                  },
                  { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                ],
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => {
                setOpen(false);
                item.onPress();
              }}
              style={({ pressed }) => [styles.itemPress, pressed && styles.pressed]}
            >
              {item.icon}
            </Pressable>
          </Animated.View>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: palette.button },
          pressed && styles.pressed,
        ]}
      >
        <Animated.View
          style={{
            width: size * 0.34,
            height: size * 0.34,
            transform: [
              { rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "135deg"] }) },
            ],
          }}
        >
          <View style={[styles.bar, styles.barAcross, { backgroundColor: palette.bar }]} />
          <View style={[styles.bar, styles.barDown, { backgroundColor: palette.bar }]} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    position: "absolute",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
  },
  itemPress: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  button: {
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.25)",
  },
  pressed: { opacity: 0.85 },
  bar: { position: "absolute", borderRadius: 2 },
  barAcross: { left: 0, right: 0, top: "50%", height: 3, marginTop: -1.5 },
  barDown: { top: 0, bottom: 0, left: "50%", width: 3, marginLeft: -1.5 },
});
