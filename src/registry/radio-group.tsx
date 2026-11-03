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

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupColors {
  accent: string;
  border: string;
  surface: string;
  selectedSurface: string;
  label: string;
  description: string;
}

const DEFAULT_COLORS: RadioGroupColors = {
  accent: "#4f46e5",
  border: "#d1d5db",
  surface: "#ffffff",
  selectedSurface: "#eef2ff",
  label: "#111827",
  description: "#6b7280",
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

export interface RadioGroupProps {
  options: RadioOption[];
  /** The selected option's value. */
  value: string;
  onChange: (value: string) => void;
  /** Spoken name of the group. */
  label?: string;
  colors?: Partial<RadioGroupColors>;
  style?: StyleProp<ViewStyle>;
}

interface RowProps {
  option: RadioOption;
  selected: boolean;
  index: number;
  count: number;
  palette: RadioGroupColors;
  reduceMotion: boolean;
  onSelect: () => void;
}

function Row({ option, selected, index, count, palette, reduceMotion, onSelect }: RowProps) {
  // Every dot stays mounted with its own value, so the spring is never cut short by an unmount.
  const dot = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      dot.setValue(selected ? 1 : 0);
      return;
    }
    Animated.spring(dot, {
      toValue: selected ? 1 : 0,
      stiffness: 420,
      damping: 20,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [selected, reduceMotion, dot]);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={option.label}
      accessibilityState={{ checked: selected, disabled: !!option.disabled }}
      accessibilityHint={option.description}
      aria-checked={selected}
      aria-disabled={!!option.disabled}
      aria-posinset={index + 1}
      aria-setsize={count}
      disabled={option.disabled}
      onPress={onSelect}
      tabIndex={selected ? 0 : -1}
      style={[
        styles.row,
        {
          borderColor: selected ? palette.accent : palette.border,
          backgroundColor: selected ? palette.selectedSurface : palette.surface,
          opacity: option.disabled ? 0.45 : 1,
        },
      ]}
    >
      <View style={[styles.ring, { borderColor: selected ? palette.accent : palette.border }]}>
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: palette.accent, opacity: dot, transform: [{ scale: dot }] },
          ]}
        />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: palette.label }]}>{option.label}</Text>
        {option.description ? (
          <Text style={[styles.description, { color: palette.description }]}>
            {option.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * A group of mutually exclusive choices drawn as cards. The selected card takes the accent colour
 * and its dot springs in. Only the selected radio is a tab stop, and on the web the arrow keys move
 * the selection, skipping disabled options and wrapping at the ends, as a native radio group does.
 */
export function RadioGroup({
  options,
  value,
  onChange,
  label = "Options",
  colors,
  style,
}: RadioGroupProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();

  const move = (direction: 1 | -1) => {
    const enabled = options.filter((option) => !option.disabled);
    if (enabled.length === 0) return;
    const at = enabled.findIndex((option) => option.value === value);
    const next = enabled[(at + direction + enabled.length) % enabled.length];
    onChange(next.value);
  };

  const onKeyDown = (event: { key: string; preventDefault: () => void }) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  };

  const webKeys = { onKeyDown } as object;

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      aria-label={label}
      {...webKeys}
      style={[styles.group, style]}
    >
      {options.map((option, index) => (
        <Row
          key={option.value}
          option={option}
          index={index}
          count={options.length}
          selected={option.value === value}
          palette={palette}
          reduceMotion={reduceMotion}
          onSelect={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    userSelect: "none",
  },
  ring: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: "600" },
  description: { fontSize: 13, lineHeight: 18 },
});
