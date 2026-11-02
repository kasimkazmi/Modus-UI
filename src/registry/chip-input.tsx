import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
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
  type TextInputKeyPressEvent,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface ChipInputColors {
  field: string;
  chip: string;
  chipText: string;
  text: string;
  placeholder: string;
  border: string;
  focus: string;
}

const DEFAULT_COLORS: ChipInputColors = {
  field: "#ffffff",
  chip: "#eef2ff",
  chipText: "#3730a3",
  text: "#111827",
  placeholder: "#9ca3af",
  border: "#d1d5db",
  focus: "#4f46e5",
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

export interface ChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** No more chips are added once there are this many. */
  maxChips?: number;
  /** Return false to reject a chip. It receives the trimmed text. */
  validate?: (text: string) => boolean;
  /** Allow the same chip twice. Without it a repeat, in any letter case, is ignored. */
  allowDuplicates?: boolean;
  colors?: Partial<ChipInputColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A tag input. Type and press Enter or comma to turn the text into a chip; chips pop in, wrap onto
 * new lines, and each has its own remove button. Backspace on an empty field removes the last chip,
 * and leaving the field keeps whatever was typed. Additions and removals are announced.
 */
export function ChipInput({
  value,
  onChange,
  placeholder = "Add a tag",
  maxChips = 8,
  validate,
  allowDuplicates = false,
  colors,
  style,
}: ChipInputProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState("");

  // Chips accepted from `raw`, in order, on top of `list`. Rejected text is dropped.
  const accept = (list: string[], raw: string[]) => {
    const next = [...list];
    const added: string[] = [];
    for (const piece of raw) {
      const chip = piece.trim();
      if (!chip || next.length >= maxChips) continue;
      if (!allowDuplicates && next.some((item) => item.toLowerCase() === chip.toLowerCase()))
        continue;
      if (validate && !validate(chip)) continue;
      next.push(chip);
      added.push(chip);
    }
    return { next, added };
  };

  const commit = (raw: string[]) => {
    const { next, added } = accept(value, raw);
    if (added.length > 0) {
      onChange(next);
      setStatus(`Added ${added.join(", ")}`);
    }
    return added.length > 0;
  };

  const handleChangeText = (incoming: string) => {
    if (!incoming.includes(",")) {
      setText(incoming);
      return;
    }
    // Typing or pasting "a,b,c" adds a and b; c stays in the field as the next chip.
    const pieces = incoming.split(",");
    const rest = pieces.pop() ?? "";
    commit(pieces);
    setText(rest);
  };

  const handleSubmit = () => {
    if (commit([text])) setText("");
  };

  const handleKeyPress = (event: TextInputKeyPressEvent) => {
    if (event.nativeEvent.key === "Backspace" && text === "" && value.length > 0) {
      removeAt(value.length - 1);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    // Leaving the field keeps a half-typed chip instead of silently losing it.
    if (commit([text]) || text.trim() === "") setText("");
  };

  const removeAt = (index: number) => {
    setStatus(`Removed ${value[index]}`);
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <View style={style}>
      <Pressable
        accessible={false}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.field,
          { backgroundColor: palette.field, borderColor: focused ? palette.focus : palette.border },
        ]}
      >
        {value.map((chip, index) => (
          <Chip
            // The same text can appear twice when duplicates are allowed, so the position joins the key.
            key={`${index}:${chip}`}
            label={chip}
            palette={palette}
            reduceMotion={reduceMotion}
            onRemove={() => removeAt(index)}
          />
        ))}
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmit}
          // react-native-web only reads blurOnSubmit; without it a single-line field blurs on Enter.
          blurOnSubmit={false}
          onKeyPress={handleKeyPress}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          submitBehavior="submit"
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={value.length >= maxChips ? "" : placeholder}
          placeholderTextColor={palette.placeholder}
          accessibilityLabel={placeholder}
          selectionColor={palette.focus}
          style={[styles.input, { color: palette.text }]}
        />
      </Pressable>
      <Text accessibilityLiveRegion="polite" aria-live="polite" style={styles.status}>
        {status}
      </Text>
    </View>
  );
}

function Chip({
  label,
  palette,
  reduceMotion,
  onRemove,
}: {
  label: string;
  palette: ChipInputColors;
  reduceMotion: boolean;
  onRemove: () => void;
}) {
  const pop = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      pop.setValue(1);
      return;
    }
    Animated.spring(pop, {
      toValue: 1,
      stiffness: 380,
      damping: 16,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [reduceMotion, pop]);

  const popStyle = useMemo(
    () => ({
      opacity: pop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
      transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
    }),
    [pop],
  );

  return (
    <Animated.View style={[styles.chip, { backgroundColor: palette.chip }, popStyle]}>
      <Text numberOfLines={1} style={[styles.chipText, { color: palette.chipText }]}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${label}`}
        // The glyph is small; the extra slop makes the touch target 44pt.
        hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }}
        onPress={onRemove}
        style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
      >
        <Text style={[styles.removeText, { color: palette.chipText }]}>×</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    minHeight: 48,
    padding: 8,
    borderWidth: 1.5,
    borderRadius: 14,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "100%",
    paddingLeft: 12,
    paddingRight: 6,
    height: 30,
    borderRadius: 15,
  },
  chipText: { flexShrink: 1, fontSize: 14, fontWeight: "600" },
  remove: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { fontSize: 18, lineHeight: 20, fontWeight: "600" },
  pressed: { opacity: 0.6 },
  input: {
    flexGrow: 1,
    flexBasis: 90,
    minWidth: 90,
    height: 30,
    paddingVertical: 0,
    paddingHorizontal: 4,
    fontSize: 15,
    // On the web the browser draws its own focus outline; the field's border is the focus ring here.
    outlineWidth: 0,
  },
  // Present for screen readers only: one pixel, fully transparent.
  status: { position: "absolute", width: 1, height: 1, opacity: 0 },
});
