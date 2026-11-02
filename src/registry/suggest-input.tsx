import { useEffect, useId, useMemo, useRef, useState } from "react";
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
const FIELD_HEIGHT = 48;
const ROW_HEIGHT = 44;
// On the web the field loses focus before a tap on a suggestion lands, so closing waits a moment.
const BLUR_DELAY = 160;

export interface SuggestInputColors {
  field: string;
  border: string;
  focusBorder: string;
  text: string;
  placeholder: string;
  panel: string;
  highlight: string;
  activeRow: string;
}

const DEFAULT_COLORS: SuggestInputColors = {
  field: "#ffffff",
  border: "#d1d5db",
  focusBorder: "#4f46e5",
  text: "#111827",
  placeholder: "#9ca3af",
  panel: "#ffffff",
  highlight: "#4f46e5",
  activeRow: "#eef2ff",
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

export interface SuggestInputProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Everything that can be suggested. The list under the field is these, narrowed by what is typed. */
  suggestions: string[];
  /** Called with the suggestion that was chosen. */
  onSelect: (suggestion: string) => void;
  placeholder?: string;
  /** How many characters must be typed before suggestions show. */
  minChars?: number;
  /** The most suggestions shown at once. */
  maxSuggestions?: number;
  /** Shown when nothing matches. */
  emptyText?: string;
  /** Spoken name of the field. */
  label?: string;
  colors?: Partial<SuggestInputColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A text field with a list of suggestions that narrows as you type. Matches that start with the text
 * come first and the part that matched is bold. On the web the arrow keys move through the list, Enter
 * chooses and Escape closes it; on a phone you tap. It is a combobox to screen readers.
 */
export function SuggestInput({
  value,
  onChangeText,
  suggestions,
  onSelect,
  placeholder = "Search",
  minChars = 1,
  maxSuggestions = 5,
  emptyText = "No matches",
  label = "Search",
  colors,
  style,
}: SuggestInputProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);
  const t = useRef(new Animated.Value(0)).current;
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = value.trim().toLowerCase();
  const matches = useMemo(() => {
    if (query.length < minChars) return [];
    const found = suggestions.filter((item) => item.toLowerCase().includes(query));
    // Suggestions that start with the text come before those that only contain it.
    found.sort(
      (a, b) =>
        Number(b.toLowerCase().startsWith(query)) - Number(a.toLowerCase().startsWith(query)),
    );
    return found.slice(0, maxSuggestions);
  }, [suggestions, query, minChars, maxSuggestions]);

  const open = focused && !dismissed && query.length >= minChars;
  const rows = matches.length > 0 ? matches.length : 1;

  useEffect(() => {
    if (reduceMotion) {
      t.setValue(open ? 1 : 0);
      return;
    }
    Animated.timing(t, {
      toValue: open ? 1 : 0,
      duration: 140,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [open, reduceMotion, t]);

  useEffect(
    () => () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    },
    [],
  );

  const choose = (item: string) => {
    onSelect(item);
    setDismissed(true);
    setActive(-1);
  };

  const onKeyPress = (event: TextInputKeyPressEvent) => {
    const key = event.nativeEvent.key;
    if (key === "ArrowDown" || key === "ArrowUp") {
      if (!open && matches.length > 0) setDismissed(false);
      if (matches.length === 0) return;
      const step = key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + step + matches.length) % matches.length);
    } else if (key === "Enter" && open && active >= 0 && matches[active]) {
      choose(matches[active]);
    } else if (key === "Escape") {
      setDismissed(true);
      setActive(-1);
    }
  };

  const optionId = (i: number) => `${id}-option-${i}`;

  return (
    <View style={[styles.root, style]}>
      <TextInput
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setDismissed(false);
          setActive(-1);
        }}
        onKeyPress={onKeyPress}
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          setFocused(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setFocused(false), BLUR_DELAY);
        }}
        // react-native-web only reads blurOnSubmit; without it a single-line field blurs on Enter.
        blurOnSubmit={false}
        placeholder={placeholder}
        placeholderTextColor={palette.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={label}
        aria-label={label}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-list`}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        selectionColor={palette.focusBorder}
        style={[
          styles.input,
          {
            backgroundColor: palette.field,
            color: palette.text,
            borderColor: focused ? palette.focusBorder : palette.border,
          },
        ]}
      />
      <Animated.View
        nativeID={`${id}-list`}
        // React Native's role type has no "listbox", but the web build passes it through, and the options need it.
        {...({ role: "listbox" } as object)}
        aria-label={`${label} suggestions`}
        pointerEvents={open ? "auto" : "none"}
        style={[
          styles.panel,
          {
            backgroundColor: palette.panel,
            borderColor: palette.border,
            opacity: t,
            transform: [
              { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) },
            ],
            height: rows * ROW_HEIGHT,
          },
        ]}
      >
        {matches.length === 0 ? (
          <View style={styles.row}>
            <Text style={[styles.empty, { color: palette.placeholder }]}>{emptyText}</Text>
          </View>
        ) : (
          matches.map((item, i) => {
            const at = item.toLowerCase().indexOf(query);
            return (
              <Pressable
                key={item}
                nativeID={optionId(i)}
                role="option"
                aria-selected={i === active}
                accessibilityState={{ selected: i === active }}
                accessibilityLabel={item}
                onPress={() => choose(item)}
                style={[styles.row, i === active && { backgroundColor: palette.activeRow }]}
              >
                <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
                  {item.slice(0, at)}
                  <Text style={[styles.match, { color: palette.highlight }]}>
                    {item.slice(at, at + query.length)}
                  </Text>
                  {item.slice(at + query.length)}
                </Text>
              </Pressable>
            );
          })
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: FIELD_HEIGHT, zIndex: 10 },
  input: {
    height: FIELD_HEIGHT,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  panel: {
    position: "absolute",
    top: FIELD_HEIGHT + 6,
    left: 0,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.18)",
  },
  row: { height: ROW_HEIGHT, justifyContent: "center", paddingHorizontal: 16 },
  text: { fontSize: 16 },
  match: { fontWeight: "800" },
  empty: { fontSize: 15 },
});
