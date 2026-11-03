import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface PasswordFieldColors {
  surface: string;
  border: string;
  focus: string;
  text: string;
  placeholder: string;
  toggle: string;
}

const DEFAULT_COLORS: PasswordFieldColors = {
  surface: "#ffffff",
  border: "#d1d5db",
  focus: "#4f46e5",
  text: "#111827",
  placeholder: "#9ca3af",
  toggle: "#4f46e5",
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

export interface PasswordFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Spoken name of the field. */
  label?: string;
  colors?: Partial<PasswordFieldColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A password input with a Show and Hide button at its end. The border eases to the accent colour
 * while the field has focus. The button says what it will do, and its pressed state is exposed, so a
 * screen reader hears "Show password" and then "Hide password".
 */
export function PasswordField({
  value,
  onChangeText,
  placeholder = "Password",
  label = "Password",
  colors,
  style,
}: PasswordFieldProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [shown, setShown] = useState(false);
  const focus = useRef(new Animated.Value(0)).current;

  const setFocus = (on: boolean) => {
    if (reduceMotion) focus.setValue(on ? 1 : 0);
    else
      Animated.timing(focus, {
        toValue: on ? 1 : 0,
        duration: 160,
        useNativeDriver: false,
      }).start();
  };

  return (
    <Animated.View
      style={[
        styles.root,
        {
          backgroundColor: palette.surface,
          borderColor: focus.interpolate({
            inputRange: [0, 1],
            outputRange: [palette.border, palette.focus],
          }),
        },
        style,
      ]}
    >
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.placeholder}
        secureTextEntry={!shown}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password"
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[styles.input, { color: palette.text }]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={shown ? "Hide password" : "Show password"}
        accessibilityState={{ selected: shown }}
        onPress={() => setShown(!shown)}
        hitSlop={8}
        style={styles.toggle}
      >
        <Text style={[styles.toggleText, { color: palette.toggle }]}>
          {shown ? "Hide" : "Show"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderRadius: 14 },
  input: { flex: 1, minWidth: 0, height: 50, paddingHorizontal: 14, fontSize: 16 },
  toggle: { paddingHorizontal: 14, height: 50, justifyContent: "center", userSelect: "none" },
  toggleText: { fontSize: 14, fontWeight: "700" },
});
