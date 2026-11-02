import { useEffect, useRef, useState, type ElementRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const HEIGHT = 60;

export interface FloatFieldColors {
  background: string;
  border: string;
  focusBorder: string;
  label: string;
  text: string;
  error: string;
  helper: string;
}

const DEFAULT_COLORS: FloatFieldColors = {
  background: "#ffffff",
  border: "#d1d5db",
  focusBorder: "#4f46e5",
  label: "#6b7280",
  text: "#111827",
  error: "#dc2626",
  helper: "#6b7280",
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

export interface FloatFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  /** The field's name. It sits inside the field, then floats up when there is text or focus. */
  label: string;
  /** A hint under the field. */
  helper?: string;
  /** Replaces the hint, turns the border red and shakes the field when it first appears. */
  error?: string;
  /** Hides the text, with a Show and Hide button. */
  secureTextEntry?: boolean;
  /** Shows a clear button while the field has text. */
  clearable?: boolean;
  disabled?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "url";
  colors?: Partial<FloatFieldColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A text field whose label starts inside the box and floats up to the top as you focus or type. The
 * border blends to the focus colour, a new error shakes the field and turns it red, and the message
 * is announced. It can hide its text with a Show button, and clears with one tap.
 */
export function FloatField({
  value,
  onChangeText,
  label,
  helper,
  error,
  secureTextEntry = false,
  clearable = true,
  disabled = false,
  keyboardType = "default",
  colors,
  style,
}: FloatFieldProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const input = useRef<ElementRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const floated = focused || value.length > 0;
  const float = useRef(new Animated.Value(floated ? 1 : 0)).current;
  const glow = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const hadError = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      float.setValue(floated ? 1 : 0);
      return;
    }
    Animated.timing(float, {
      toValue: floated ? 1 : 0,
      duration: 160,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [floated, reduceMotion, float]);

  useEffect(() => {
    if (reduceMotion) {
      glow.setValue(focused ? 1 : 0);
      return;
    }
    Animated.timing(glow, {
      toValue: focused ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [focused, reduceMotion, glow]);

  // A shake when an error first appears, not every time it is re-rendered.
  useEffect(() => {
    const has = !!error;
    if (has && !hadError.current && !reduceMotion) {
      Animated.sequence(
        [-8, 8, -6, 6, -3, 0].map((toValue) =>
          Animated.timing(shake, { toValue, duration: 50, useNativeDriver: NATIVE_DRIVER }),
        ),
      ).start();
    }
    hadError.current = has;
  }, [error, reduceMotion, shake]);

  const borderColor = error
    ? palette.error
    : glow.interpolate({ inputRange: [0, 1], outputRange: [palette.border, palette.focusBorder] });
  const labelColor = error ? palette.error : focused ? palette.focusBorder : palette.label;
  const message = error ?? helper;
  const clear = () => {
    onChangeText("");
    input.current?.focus();
  };

  return (
    <View style={style}>
      <Animated.View
        style={[
          styles.box,
          {
            backgroundColor: palette.background,
            borderColor,
            borderWidth: focused || error ? 2 : 1.5,
            transform: [{ translateX: shake }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Animated.Text
          pointerEvents="none"
          numberOfLines={1}
          style={[
            styles.label,
            {
              color: labelColor,
              transform: [
                { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
                { scale: float.interpolate({ inputRange: [0, 1], outputRange: [1, 0.76] }) },
              ],
            },
          ]}
        >
          {label}
        </Animated.Text>
        <TextInput
          ref={input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!disabled}
          secureTextEntry={secureTextEntry && !revealed}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          aria-label={label}
          aria-invalid={!!error}
          aria-disabled={disabled}
          accessibilityHint={message}
          selectionColor={palette.focusBorder}
          style={[styles.input, { color: palette.text }]}
        />
        {clearable && value.length > 0 && !secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            hitSlop={10}
            // It stays mounted whenever there is text: on the web, pressing a button blurs the field
            // first, and a button that only showed while focused would vanish before the click landed.
            onPress={clear}
            style={styles.action}
          >
            <Text style={[styles.clear, { color: palette.label }]}>×</Text>
          </Pressable>
        ) : null}
        {secureTextEntry && value.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? `Hide ${label}` : `Show ${label}`}
            hitSlop={10}
            onPress={() => setRevealed((shown) => !shown)}
            style={styles.action}
          >
            <Text style={[styles.toggle, { color: palette.focusBorder }]}>
              {revealed ? "Hide" : "Show"}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
      {message ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.message, { color: error ? palette.error : palette.helper }]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: HEIGHT, borderRadius: 12, justifyContent: "center", paddingHorizontal: 14 },
  label: {
    position: "absolute",
    left: 14,
    top: 18,
    fontSize: 16,
    transformOrigin: "left center",
  },
  input: {
    fontSize: 16,
    paddingTop: 20,
    paddingBottom: 4,
    paddingRight: 44,
    height: HEIGHT - 4,
    outlineStyle: "none",
  } as object,
  action: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  clear: { fontSize: 24, lineHeight: 26 },
  toggle: { fontSize: 13, fontWeight: "700" },
  message: { marginTop: 6, marginHorizontal: 4, fontSize: 13, lineHeight: 18 },
});
