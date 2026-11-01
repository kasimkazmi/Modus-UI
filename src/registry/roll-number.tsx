import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface RollNumberColors {
  /** Color of the digits and the surrounding text. */
  text: string;
}

const DEFAULT_COLORS: RollNumberColors = { text: "#111827" };
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
// Each digit, counting from the right, starts rolling this much later than the one after it.
const STAGGER = 45;

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

type Token = { key: string; digit: number; position: number } | { key: string; text: string };

function format(value: number, decimals: number) {
  const fixed = Math.abs(value).toFixed(Math.max(0, decimals));
  const [whole, fraction] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return {
    // A value that rounds to zero is not shown as negative.
    negative: value < 0 && Number(fixed) !== 0,
    text: `${grouped}${fraction ? `.${fraction}` : ""}`,
  };
}

/** Splits the text into digits and fixed characters. A digit is keyed by its place from the right,
 *  so adding or removing a digit on the left never moves the columns that stay. */
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    const char = text[i];
    if (/\d/.test(char)) {
      tokens.unshift({ key: `d${position}`, digit: Number(char), position });
      position++;
    } else {
      tokens.unshift({
        key: `t${position}${char === "," ? "c" : char === "." ? "p" : "m"}`,
        text: char,
      });
    }
  }
  return tokens;
}

export interface RollNumberProps {
  value: number;
  /** Digits after the decimal point. */
  decimals?: number;
  /** Text before the number, such as a currency symbol. */
  prefix?: string;
  /** Text after the number, such as a unit. */
  suffix?: string;
  fontSize?: number;
  colors?: Partial<RollNumberColors>;
  /** How long each digit takes to roll, in milliseconds. */
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * An odometer. Each digit is a column that rolls to its new value, starting from the last digit and
 * moving left. Thousands separators stay put, the number may grow or shrink in length, and screen
 * readers get the whole value as one piece of text instead of a column of digits.
 */
export function RollNumber({
  value,
  decimals = 0,
  prefix,
  suffix,
  fontSize = 40,
  colors,
  duration = 700,
  style,
}: RollNumberProps) {
  const color = { ...DEFAULT_COLORS, ...colors }.text;
  const reduceMotion = useReduceMotion();
  const { negative, text } = format(value, decimals);
  const tokens = tokenize(text);
  const lineHeight = Math.round(fontSize * 1.25);
  const textStyle = { fontSize, lineHeight, color };

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${negative ? "-" : ""}${prefix ?? ""}${text}${suffix ?? ""}`}
      style={[styles.row, { height: lineHeight }, style]}
    >
      {negative ? (
        <Text aria-hidden style={[styles.char, textStyle]}>
          -
        </Text>
      ) : null}
      {prefix ? (
        <Text aria-hidden style={[styles.char, textStyle]}>
          {prefix}
        </Text>
      ) : null}
      {tokens.map((token) =>
        "digit" in token ? (
          <DigitColumn
            key={token.key}
            digit={token.digit}
            position={token.position}
            fontSize={fontSize}
            lineHeight={lineHeight}
            color={color}
            duration={duration}
            reduceMotion={reduceMotion}
          />
        ) : (
          <Text key={token.key} aria-hidden style={[styles.char, textStyle]}>
            {token.text}
          </Text>
        ),
      )}
      {suffix ? (
        <Text aria-hidden style={[styles.char, textStyle]}>
          {suffix}
        </Text>
      ) : null}
    </View>
  );
}

function DigitColumn({
  digit,
  position,
  fontSize,
  lineHeight,
  color,
  duration,
  reduceMotion,
}: {
  digit: number;
  position: number;
  fontSize: number;
  lineHeight: number;
  color: string;
  duration: number;
  reduceMotion: boolean;
}) {
  // A new column starts on its digit, so growing the number does not roll in from zero.
  const y = useRef(new Animated.Value(-digit * lineHeight)).current;
  const strip = useMemo(() => ({ transform: [{ translateY: y }] }), [y]);

  useEffect(() => {
    const target = -digit * lineHeight;
    if (reduceMotion || duration <= 0) {
      y.setValue(target);
      return;
    }
    const roll = Animated.timing(y, {
      toValue: target,
      duration,
      delay: position * STAGGER,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });
    roll.start();
    return () => roll.stop();
  }, [digit, lineHeight, position, duration, reduceMotion, y]);

  return (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{ height: lineHeight, width: Math.round(fontSize * 0.62), overflow: "hidden" }}
    >
      <Animated.View style={strip}>
        {DIGITS.map((n) => (
          <Text key={n} style={[styles.digit, { fontSize, lineHeight, height: lineHeight, color }]}>
            {n}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", userSelect: "none" },
  char: { fontWeight: "700", fontVariant: ["tabular-nums"] },
  digit: { fontWeight: "700", textAlign: "center", fontVariant: ["tabular-nums"] },
});
