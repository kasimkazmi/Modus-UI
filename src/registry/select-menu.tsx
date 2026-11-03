import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const ROW = 48;

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectMenuColors {
  surface: string;
  border: string;
  text: string;
  placeholder: string;
  selected: string;
  accent: string;
}

const DEFAULT_COLORS: SelectMenuColors = {
  surface: "#ffffff",
  border: "#d1d5db",
  text: "#111827",
  placeholder: "#9ca3af",
  selected: "#eef2ff",
  accent: "#4f46e5",
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

export interface SelectMenuProps {
  options: SelectOption[];
  /** The chosen option's value, or an empty string for none. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Spoken name of the menu. */
  label?: string;
  colors?: Partial<SelectMenuColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A dropdown that opens in place, pushing the content below it down instead of floating over it, which
 * keeps it inside a scrolling screen. The chevron turns and the list grows open; choosing an option or
 * pressing Escape on the web closes it. The trigger reports whether it is expanded.
 */
export function SelectMenu({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label = "Select",
  colors,
  style,
}: SelectMenuProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [open, setOpen] = useState(false);
  const t = useRef(new Animated.Value(0)).current;
  const chosen = options.find((option) => option.value === value);
  const live = useRef({ setOpen });
  live.current = { setOpen };

  useEffect(() => {
    if (reduceMotion) {
      t.setValue(open ? 1 : 0);
      return;
    }
    Animated.timing(t, {
      toValue: open ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [open, reduceMotion, t]);

  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") live.current.setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: palette.surface, borderColor: open ? palette.accent : palette.border },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${chosen ? chosen.label : placeholder}`}
        accessibilityState={{ expanded: open }}
        aria-haspopup="listbox"
        aria-expanded={open}
        onPress={() => setOpen(!open)}
        style={styles.trigger}
      >
        <Text style={[styles.value, { color: chosen ? palette.text : palette.placeholder }]}>
          {chosen ? chosen.label : placeholder}
        </Text>
        <Animated.Text
          style={[
            styles.chevron,
            {
              color: palette.placeholder,
              transform: [
                { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) },
              ],
            },
          ]}
        >
          ⌄
        </Animated.Text>
      </Pressable>
      <Animated.View
        style={{
          overflow: "hidden",
          height: t.interpolate({ inputRange: [0, 1], outputRange: [0, options.length * ROW] }),
        }}
        pointerEvents={open ? "auto" : "none"}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              aria-selected={selected}
              tabIndex={open ? 0 : -1}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={[
                styles.option,
                {
                  backgroundColor: selected ? palette.selected : "transparent",
                  borderTopColor: palette.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: palette.text, fontWeight: selected ? "700" : "500" },
                ]}
              >
                {option.label}
              </Text>
              {selected ? (
                <Text style={{ color: palette.accent, fontWeight: "800" }}>✓</Text>
              ) : null}
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderWidth: 2, borderRadius: 14, overflow: "hidden" },
  trigger: {
    minHeight: ROW,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    userSelect: "none",
  },
  value: { fontSize: 16 },
  chevron: { fontSize: 22, fontWeight: "700" },
  option: {
    height: ROW,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    userSelect: "none",
  },
  optionText: { fontSize: 16 },
});
