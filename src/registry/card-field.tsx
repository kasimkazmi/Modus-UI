import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface CardValue {
  number: string;
  expiry: string;
  cvc: string;
}

export interface CardFieldColors {
  surface: string;
  border: string;
  text: string;
  placeholder: string;
  error: string;
  valid: string;
}

const DEFAULT_COLORS: CardFieldColors = {
  surface: "#ffffff",
  border: "#d1d5db",
  text: "#111827",
  placeholder: "#9ca3af",
  error: "#dc2626",
  valid: "#16a34a",
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

const digits = (text: string) => text.replace(/\D/g, "");

function brandOf(number: string) {
  if (/^3[47]/.test(number)) return "Amex";
  if (/^4/.test(number)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(number)) return "Mastercard";
  if (/^6/.test(number)) return "Discover";
  return "Card";
}

function formatNumber(text: string) {
  const raw = digits(text);
  if (brandOf(raw) === "Amex") {
    const n = raw.slice(0, 15);
    return [n.slice(0, 4), n.slice(4, 10), n.slice(10)].filter(Boolean).join(" ");
  }
  return (raw.slice(0, 16).match(/.{1,4}/g) ?? []).join(" ");
}

function formatExpiry(text: string) {
  const raw = digits(text).slice(0, 4);
  return raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
}

function luhn(number: string) {
  let sum = 0;
  [...number].reverse().forEach((char, i) => {
    let d = Number(char);
    if (i % 2 === 1) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  });
  return sum % 10 === 0;
}

export interface CardFieldProps {
  value: CardValue;
  onChange: (value: CardValue) => void;
  colors?: Partial<CardFieldColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A card entry field. The number groups itself as you type, in fours or in the 4-6-5 pattern of an
 * Amex, the brand name appears from the first digits, the expiry adds its own slash, and a full
 * number that fails the Luhn check shakes and turns red. Each input has its own spoken name and the
 * numeric keyboard.
 */
export function CardField({ value, onChange, colors, style }: CardFieldProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const shake = useRef(new Animated.Value(0)).current;
  const raw = digits(value.number);
  const brand = brandOf(raw);
  const length = brand === "Amex" ? 15 : 16;
  const complete = raw.length === length;
  const valid = complete && luhn(raw);
  const bad = complete && !valid;
  const wasBad = useRef(false);

  useEffect(() => {
    if (bad && !wasBad.current && !reduceMotion) {
      Animated.sequence(
        [-6, 6, -4, 4, 0].map((toValue) =>
          Animated.timing(shake, { toValue, duration: 50, useNativeDriver: NATIVE_DRIVER }),
        ),
      ).start();
    }
    wasBad.current = bad;
  }, [bad, reduceMotion, shake]);

  const input = (props: React.ComponentProps<typeof TextInput>) => (
    <TextInput
      keyboardType="number-pad"
      placeholderTextColor={palette.placeholder}
      style={[styles.input, { color: palette.text }]}
      {...props}
    />
  );

  return (
    <Animated.View
      style={[
        styles.root,
        {
          backgroundColor: palette.surface,
          borderColor: bad ? palette.error : palette.border,
          transform: [{ translateX: shake }],
        },
        style,
      ]}
    >
      <View style={styles.top}>
        {input({
          accessibilityLabel: "Card number",
          autoComplete: "cc-number",
          placeholder: "1234 5678 9012 3456",
          value: value.number,
          onChangeText: (text) => onChange({ ...value, number: formatNumber(text) }),
          style: [styles.input, styles.number, { color: palette.text }],
        })}
        <Text
          style={[
            styles.brand,
            { color: valid ? palette.valid : bad ? palette.error : palette.placeholder },
          ]}
        >
          {valid ? `${brand} ✓` : brand}
        </Text>
      </View>
      <View style={[styles.bottom, { borderTopColor: palette.border }]}>
        {input({
          accessibilityLabel: "Expiry date",
          autoComplete: "cc-exp",
          placeholder: "MM/YY",
          value: value.expiry,
          onChangeText: (text) => onChange({ ...value, expiry: formatExpiry(text) }),
          style: [styles.input, styles.half, { color: palette.text }],
        })}
        {input({
          accessibilityLabel: "Security code",
          autoComplete: "cc-csc",
          placeholder: brand === "Amex" ? "CVC (4)" : "CVC",
          secureTextEntry: true,
          value: value.cvc,
          onChangeText: (text) =>
            onChange({ ...value, cvc: digits(text).slice(0, brand === "Amex" ? 4 : 3) }),
          style: [
            styles.input,
            styles.half,
            { color: palette.text, borderLeftColor: palette.border, borderLeftWidth: 1 },
          ],
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { borderWidth: 1.5, borderRadius: 14, overflow: "hidden" },
  top: { flexDirection: "row", alignItems: "center", paddingRight: 14 },
  input: { height: 50, paddingHorizontal: 14, fontSize: 16 },
  number: { flex: 1 },
  half: { flex: 1 },
  brand: { fontSize: 13, fontWeight: "700" },
  bottom: { flexDirection: "row", borderTopWidth: 1 },
});
