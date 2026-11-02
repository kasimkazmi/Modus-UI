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
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "delete"] as const;

export interface PinPadColors {
  text: string;
  mutedText: string;
  dot: string;
  key: string;
  keyText: string;
  error: string;
  success: string;
}

const DEFAULT_COLORS: PinPadColors = {
  text: "#111827",
  mutedText: "#6b7280",
  dot: "#9ca3af",
  key: "#f3f4f6",
  keyText: "#111827",
  error: "#dc2626",
  success: "#16a34a",
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

export interface PinPadProps {
  /** Receives the full PIN. Return true to accept it; false shakes the dots and clears them. */
  onComplete: (pin: string) => boolean | Promise<boolean>;
  /** How many digits make a PIN. */
  length?: number;
  title?: string;
  /** Shown under the dots after a wrong PIN. */
  errorText?: string;
  colors?: Partial<PinPadColors>;
  style?: StyleProp<ViewStyle>;
}

type Status = "idle" | "checking" | "error" | "ok";

/**
 * A numeric keypad for PINs and passcodes. Dots fill with a small pop as digits go in, a wrong PIN
 * shakes the row and clears it, and a right one turns the dots green. Every key is a full-size
 * button with a spoken label; the dots announce progress as a single value.
 */
export function PinPad({
  onComplete,
  length = 4,
  title,
  errorText = "Wrong PIN, try again",
  colors,
  style,
}: PinPadProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const shake = useRef(new Animated.Value(0)).current;

  const submit = async (value: string) => {
    setStatus("checking");
    const accepted = await onComplete(value);
    if (accepted) {
      setStatus("ok");
      return;
    }
    setStatus("error");
    if (!reduceMotion) {
      Animated.sequence(
        [-12, 12, -9, 9, -5, 0].map((toValue) =>
          Animated.timing(shake, { toValue, duration: 55, useNativeDriver: NATIVE_DRIVER }),
        ),
      ).start();
    }
    setTimeout(() => {
      setPin("");
      setStatus("idle");
    }, 700);
  };

  const press = (key: (typeof KEYS)[number]) => {
    if (status === "checking" || status === "error" || status === "ok") return;
    if (key === "delete") {
      setPin((current) => current.slice(0, -1));
      return;
    }
    if (key === "" || pin.length >= length) return;
    const next = pin + key;
    setPin(next);
    if (next.length === length) submit(next);
  };

  const dotColor =
    status === "error" ? palette.error : status === "ok" ? palette.success : palette.dot;

  return (
    <View style={[styles.root, style]}>
      {title ? <Text style={[styles.title, { color: palette.text }]}>{title}</Text> : null}
      <Animated.View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="PIN"
        accessibilityValue={{ min: 0, max: length, now: pin.length }}
        aria-valuemin={0}
        aria-valuemax={length}
        aria-valuenow={pin.length}
        style={[styles.dots, { transform: [{ translateX: shake }] }]}
      >
        {Array.from({ length }, (_, i) => (
          <Dot key={i} filled={i < pin.length} color={dotColor} reduceMotion={reduceMotion} />
        ))}
      </Animated.View>
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.error, { color: palette.error, opacity: status === "error" ? 1 : 0 }]}
      >
        {errorText}
      </Text>
      <View style={styles.grid}>
        {KEYS.map((key) =>
          key === "" ? (
            <View key="blank" style={styles.key} />
          ) : (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key === "delete" ? "Delete" : key}
              onPress={() => press(key)}
              style={({ pressed }) => [
                styles.key,
                { backgroundColor: key === "delete" ? "transparent" : palette.key },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.keyText,
                  { color: key === "delete" ? palette.mutedText : palette.keyText },
                  key === "delete" && styles.deleteText,
                ]}
              >
                {key === "delete" ? "⌫" : key}
              </Text>
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

function Dot({
  filled,
  color,
  reduceMotion,
}: {
  filled: boolean;
  color: string;
  reduceMotion: boolean;
}) {
  const scale = useRef(new Animated.Value(filled ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(filled ? 1 : 0);
      return;
    }
    Animated.spring(scale, {
      toValue: filled ? 1 : 0,
      stiffness: 520,
      damping: 16,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [filled, reduceMotion, scale]);

  return (
    <View style={[styles.dot, { borderColor: color }]}>
      <Animated.View
        style={[styles.fill, { backgroundColor: color, transform: [{ scale }], opacity: scale }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", userSelect: "none" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 22 },
  dots: { flexDirection: "row", gap: 18, height: 20, alignItems: "center" },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, overflow: "hidden" },
  fill: { flex: 1 },
  error: { marginTop: 14, height: 18, fontSize: 13, fontWeight: "600" },
  grid: { width: 264, flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 18 },
  key: { width: 80, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  keyText: { fontSize: 26, fontWeight: "600" },
  deleteText: { fontSize: 24 },
  pressed: { opacity: 0.6 },
});
