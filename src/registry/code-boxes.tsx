import { useEffect, useMemo, useRef, useState } from "react";
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
const BOX_HEIGHT = 58;

export interface CodeBoxesColors {
  box: string;
  border: string;
  focusBorder: string;
  text: string;
  error: string;
}

const DEFAULT_COLORS: CodeBoxesColors = {
  box: "#ffffff",
  border: "#d1d5db",
  focusBorder: "#4f46e5",
  text: "#111827",
  error: "#dc2626",
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

export interface CodeBoxesProps {
  /** The code entered so far. */
  value: string;
  onChange: (next: string) => void;
  /** How many characters make the code. */
  length?: number;
  /** Called once when the last character arrives, with the full code. */
  onComplete?: (code: string) => void;
  /** Accept digits only and show a numeric keyboard. */
  numeric?: boolean;
  autoFocus?: boolean;
  /** Turns the boxes the error color and shakes them. */
  error?: boolean;
  disabled?: boolean;
  colors?: Partial<CodeBoxesColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A one-time-code field drawn as separate boxes. One real, invisible input sits over them, so paste,
 * the keyboard and SMS autofill all work, and the boxes only show what it holds. The active box has
 * a ring and a blinking caret, each character pops in, and a wrong code shakes the row.
 */
export function CodeBoxes({
  value,
  onChange,
  length = 6,
  onComplete,
  numeric = true,
  autoFocus = false,
  error = false,
  disabled = false,
  colors,
  style,
}: CodeBoxesProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [focused, setFocused] = useState(false);
  // Re-rendering with an unchanged value makes the input drop a character we refused (a letter in
  // numeric mode); bumping this is how we force that.
  const [, setRefresh] = useState(0);
  const blink = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const completedFor = useRef<string | null>(null);
  const wasError = useRef(false);

  const clean = (raw: string) =>
    (numeric ? raw.replace(/\D/g, "") : raw.replace(/[^a-z0-9]/gi, "")).slice(0, length);

  const handleChangeText = (raw: string) => {
    const next = clean(raw);
    if (next !== value) onChange(next);
    else if (raw !== value) setRefresh((n) => n + 1);
  };

  // Report completion once per complete code, and again only after it has been edited.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  useEffect(() => {
    if (value.length < length) {
      completedFor.current = null;
      return;
    }
    if (value.length === length && completedFor.current !== value) {
      completedFor.current = value;
      onCompleteRef.current?.(value);
    }
  }, [value, length]);

  // The caret blinks on its own value, so it keeps running while the active box moves.
  useEffect(() => {
    blink.setValue(1);
    if (!focused || reduceMotion || disabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: 500, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(blink, { toValue: 1, duration: 500, useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [focused, reduceMotion, disabled, blink]);

  // Shake once each time the error turns on.
  useEffect(() => {
    if (error && !wasError.current && !reduceMotion) {
      Animated.sequence(
        [-10, 10, -7, 7, -3, 0].map((toValue) =>
          Animated.timing(shake, { toValue, duration: 55, useNativeDriver: NATIVE_DRIVER }),
        ),
      ).start();
    }
    wasError.current = error;
  }, [error, reduceMotion, shake]);

  const rowStyle = useMemo(() => ({ transform: [{ translateX: shake }] }), [shake]);
  const active = Math.min(value.length, length - 1);

  return (
    <View style={[styles.root, style]}>
      <Animated.View style={[styles.wrap, rowStyle]}>
        <View
          pointerEvents="none"
          style={styles.row}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
        >
          {Array.from({ length }, (_, index) => (
            <Box
              key={`box-${index}`}
              char={value[index] ?? ""}
              isActive={focused && !disabled && index === active}
              showCaret={value.length < length && index === value.length}
              error={error}
              disabled={disabled}
              blink={blink}
              reduceMotion={reduceMotion}
              palette={palette}
            />
          ))}
        </View>
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!disabled}
          autoFocus={autoFocus}
          keyboardType={numeric ? "number-pad" : "default"}
          inputMode={numeric ? "numeric" : "text"}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoCapitalize="none"
          autoCorrect={false}
          // react-native-web blurs a single-line field on Enter unless told not to.
          blurOnSubmit={false}
          caretHidden
          selectionColor="transparent"
          accessibilityLabel="Verification code"
          aria-label="Verification code"
          aria-disabled={disabled}
          style={styles.input}
        />
      </Animated.View>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {`${value.length} of ${length} ${numeric ? "digits" : "characters"} entered`}
      </Text>
    </View>
  );
}

function Box({
  char,
  isActive,
  showCaret,
  error,
  disabled,
  blink,
  reduceMotion,
  palette,
}: {
  char: string;
  isActive: boolean;
  showCaret: boolean;
  error: boolean;
  disabled: boolean;
  blink: Animated.Value;
  reduceMotion: boolean;
  palette: CodeBoxesColors;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const previous = useRef(char);

  // Pop when a character lands in an empty box.
  useEffect(() => {
    if (char && !previous.current && !reduceMotion) {
      scale.setValue(0.8);
      Animated.spring(scale, {
        toValue: 1,
        stiffness: 520,
        damping: 14,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }).start();
    }
    previous.current = char;
  }, [char, reduceMotion, scale]);

  const popStyle = useMemo(() => ({ transform: [{ scale }] }), [scale]);
  const caretStyle = useMemo(() => ({ opacity: blink }), [blink]);
  const borderColor = error ? palette.error : isActive ? palette.focusBorder : palette.border;

  return (
    <Animated.View
      style={[
        styles.box,
        {
          backgroundColor: palette.box,
          borderColor,
          borderWidth: isActive || error ? 2 : 1.5,
          opacity: disabled ? 0.5 : 1,
        },
        popStyle,
      ]}
    >
      <Text style={[styles.char, { color: error ? palette.error : palette.text }]}>{char}</Text>
      {/* Always mounted so its blink never restarts; only its visibility follows the active box. */}
      <View
        pointerEvents="none"
        style={[styles.caretSlot, { opacity: isActive && showCaret ? 1 : 0 }]}
      >
        <Animated.View
          style={[styles.caret, { backgroundColor: palette.focusBorder }, caretStyle]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // userSelect keeps a mouse press on the web from selecting the digits.
  root: { alignSelf: "stretch", userSelect: "none" },
  wrap: { alignSelf: "stretch" },
  row: { flexDirection: "row", gap: 8 },
  box: {
    flex: 1,
    maxWidth: 56,
    height: BOX_HEIGHT,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  char: { fontSize: 26, fontWeight: "700" },
  caretSlot: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  caret: { width: 2, height: 28, borderRadius: 1 },
  // Covers the boxes so a tap anywhere focuses it and paste lands in it, but shows nothing itself.
  input: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
    color: "transparent",
  },
  // Visually hidden, but still announced by screen readers.
  status: { position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 },
});
