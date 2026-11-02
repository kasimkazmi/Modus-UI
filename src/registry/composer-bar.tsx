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
  type LayoutChangeEvent,
  type TextInputKeyPressEvent,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const LINE = 22;
const MIN_HEIGHT = 40;

export interface ComposerBarColors {
  background: string;
  field: string;
  border: string;
  text: string;
  placeholder: string;
  accent: string;
  accentText: string;
  icon: string;
}

const DEFAULT_COLORS: ComposerBarColors = {
  background: "#ffffff",
  field: "#f3f4f6",
  border: "#e5e7eb",
  text: "#111827",
  placeholder: "#9ca3af",
  accent: "#4f46e5",
  accentText: "#ffffff",
  icon: "#6b7280",
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

export interface ComposerBarProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Called with the trimmed text when the send button or Enter (on the web) is pressed. */
  onSend: (text: string) => void;
  placeholder?: string;
  /** How many lines the field grows to before it scrolls. */
  maxLines?: number;
  /** Shows a plus button on the left when given. */
  onAttach?: () => void;
  /** Shows a microphone in place of the send button while the field is empty, when given. */
  onRecord?: () => void;
  disabled?: boolean;
  colors?: Partial<ComposerBarColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A message composer. The field grows line by line up to a limit, and the button on the right turns
 * from a microphone into a send arrow as soon as there is text, with the two glyphs swapping on a
 * spring. On the web Enter sends and Shift+Enter starts a new line. It clears itself after sending.
 */
export function ComposerBar({
  value,
  onChangeText,
  onSend,
  placeholder = "Message",
  maxLines = 5,
  onAttach,
  onRecord,
  disabled = false,
  colors,
  style,
}: ComposerBarProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const input = useRef<ElementRef<typeof TextInput>>(null);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const text = value.trim();
  const ready = text.length > 0;
  const mode = useRef(new Animated.Value(ready ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      mode.setValue(ready ? 1 : 0);
      return;
    }
    Animated.spring(mode, {
      toValue: ready ? 1 : 0,
      stiffness: 420,
      damping: 24,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [ready, reduceMotion, mode]);

  const send = () => {
    if (!ready || disabled) return;
    onSend(text);
    onChangeText("");
    setHeight(MIN_HEIGHT);
    input.current?.focus();
  };

  const onMirrorLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height + 14;
    setHeight(Math.max(MIN_HEIGHT, Math.min(LINE * maxLines + 14, next)));
  };

  const onKeyPress = (event: TextInputKeyPressEvent) => {
    const native = event.nativeEvent as typeof event.nativeEvent & { shiftKey?: boolean };
    if (Platform.OS === "web" && native.key === "Enter" && !native.shiftKey) {
      (event as unknown as { preventDefault?: () => void }).preventDefault?.();
      send();
    }
  };

  const showAction = ready || !!onRecord;
  const micOpacity = mode.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const sendOpacity = mode;

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: palette.background, borderTopColor: palette.border },
        style,
      ]}
    >
      {onAttach ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add attachment"
          disabled={disabled}
          onPress={onAttach}
          style={({ pressed }) => [styles.side, pressed && styles.dim]}
        >
          <Text style={[styles.plus, { color: palette.icon }]}>+</Text>
        </Pressable>
      ) : null}
      <View
        style={[styles.field, { backgroundColor: palette.field, minHeight: MIN_HEIGHT, height }]}
      >
        {/* A hidden copy of the text, wrapped like the field, whose height sets the field's. Measuring the
            field itself fails on the web: it reports a taller content size than it needs and never shrinks. */}
        <Text
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onLayout={onMirrorLayout}
          style={[styles.mirror, { fontSize: 16, lineHeight: LINE }]}
        >
          {value.endsWith("\n") || value === "" ? `${value} ` : value}
        </Text>
        <TextInput
          ref={input}
          value={value}
          onChangeText={onChangeText}
          onKeyPress={onKeyPress}
          editable={!disabled}
          multiline
          blurOnSubmit={false}
          placeholder={placeholder}
          placeholderTextColor={palette.placeholder}
          accessibilityLabel={placeholder}
          aria-label={placeholder}
          selectionColor={palette.accent}
          style={[styles.input, { color: palette.text, height: height - 2 }]}
        />
      </View>
      {showAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ready ? "Send message" : "Record voice message"}
          disabled={disabled || (!ready && !onRecord)}
          onPress={ready ? send : onRecord}
          style={({ pressed }) => [styles.side, pressed && styles.dim]}
        >
          <Animated.View
            style={[
              styles.action,
              {
                backgroundColor: ready ? palette.accent : "transparent",
                transform: [
                  { scale: mode.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                ],
              },
            ]}
          >
            <Animated.Text style={[styles.glyph, { color: palette.icon, opacity: micOpacity }]}>
              ●
            </Animated.Text>
            <Animated.Text
              style={[
                styles.glyph,
                styles.over,
                {
                  color: palette.accentText,
                  opacity: sendOpacity,
                  transform: [
                    {
                      rotate: mode.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["-90deg", "0deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              ↑
            </Animated.Text>
          </Animated.View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  side: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
  },
  plus: { fontSize: 30, lineHeight: 32, fontWeight: "300" },
  field: { flex: 1, borderRadius: 20, paddingHorizontal: 14, justifyContent: "center" },
  input: { fontSize: 16, lineHeight: LINE, paddingVertical: 7, outlineStyle: "none" } as object,
  action: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: { fontSize: 18, fontWeight: "800" },
  over: { position: "absolute" },
  mirror: { position: "absolute", left: 14, right: 14, top: 0, opacity: 0, paddingVertical: 0 },
  dim: { opacity: 0.6 },
});
