import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
// Width reserved for the check mark, which opens up as a chip is selected.
const CHECK_WIDTH = 20;

export interface ChoiceChipOption {
  value: string;
  label: string;
}

export interface ChoiceChipsColors {
  chip: string;
  selectedChip: string;
  text: string;
  selectedText: string;
  border: string;
}

const DEFAULT_COLORS: ChoiceChipsColors = {
  chip: "#f3f4f6",
  selectedChip: "#4f46e5",
  text: "#374151",
  selectedText: "#ffffff",
  border: "#d1d5db",
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

export interface ChoiceChipsProps {
  options: ChoiceChipOption[];
  /** The selected values. */
  value: string[];
  onChange: (next: string[]) => void;
  /** Allow more than one chip to be selected. Otherwise it behaves like a radio group. */
  multiple?: boolean;
  /** The fewest chips that may stay selected. With 1, the last selected chip cannot be turned off. */
  min?: number;
  /** The most chips that may be selected at once, in multiple mode. Further chips dim until one is removed. */
  max?: number;
  colors?: Partial<ChoiceChipsColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * Selectable chips for a single choice or several. Selecting blends the chip to its selected color
 * and opens a check mark in front of the label, the chip pushes in while pressed, and everything
 * wraps onto as many lines as it needs. Each chip is at least 44pt tall and reads as a radio button
 * or checkbox to screen readers.
 */
export function ChoiceChips({
  options,
  value,
  onChange,
  multiple = false,
  min = 0,
  max,
  colors,
  style,
}: ChoiceChipsProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const atMax = multiple && max !== undefined && value.length >= max;

  const toggle = (option: string) => {
    const selected = value.includes(option);
    if (!multiple) {
      if (selected) {
        if (min < 1) onChange([]);
        return;
      }
      onChange([option]);
      return;
    }
    if (selected) {
      if (value.length > min) onChange(value.filter((item) => item !== option));
      return;
    }
    if (!atMax) onChange([...value, option]);
  };

  return (
    <View role={multiple ? "group" : "radiogroup"} style={[styles.row, style]}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <Chip
            key={option.value}
            label={option.label}
            selected={selected}
            multiple={multiple}
            disabled={!selected && atMax}
            reduceMotion={reduceMotion}
            palette={palette}
            onPress={() => toggle(option.value)}
          />
        );
      })}
    </View>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  multiple: boolean;
  disabled: boolean;
  reduceMotion: boolean;
  palette: ChoiceChipsColors;
  onPress: () => void;
}

function Chip({ label, selected, multiple, disabled, reduceMotion, palette, onPress }: ChipProps) {
  // 0 = off, 1 = on. Everything that changes with selection reads from this one value.
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(selected ? 1 : 0);
      return;
    }
    Animated.spring(progress, {
      toValue: selected ? 1 : 0,
      stiffness: 380,
      damping: 26,
      mass: 1,
      // Width and color are layout and paint properties, so this one runs on the JS driver.
      useNativeDriver: false,
    }).start();
  }, [selected, reduceMotion, progress]);

  // Built once per palette so the animated styles keep their identity between renders.
  const animated = useMemo(() => {
    const clamp = { extrapolate: "clamp" as const };
    return {
      fill: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], ...clamp }),
      checkWidth: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, CHECK_WIDTH],
        ...clamp,
      }),
      checkScale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1], ...clamp }),
      textColor: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [palette.text, palette.selectedText],
        ...clamp,
      }),
      borderColor: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [palette.border, palette.selectedChip],
        ...clamp,
      }),
    };
  }, [progress, palette.text, palette.selectedText, palette.border, palette.selectedChip]);

  const pressTo = (toValue: number) => {
    if (reduceMotion) return;
    Animated.spring(press, {
      toValue,
      stiffness: 520,
      damping: 28,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: press }], opacity: disabled ? 0.45 : 1 }}>
      <Pressable
        role={multiple ? "checkbox" : "radio"}
        accessibilityState={{ checked: selected, disabled }}
        aria-checked={selected}
        aria-disabled={disabled}
        disabled={disabled}
        hitSlop={4}
        onPress={onPress}
        onPressIn={() => pressTo(0.95)}
        onPressOut={() => pressTo(1)}
      >
        <Animated.View
          style={[
            styles.chip,
            { backgroundColor: palette.chip, borderColor: animated.borderColor },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.fill, { backgroundColor: palette.selectedChip, opacity: animated.fill }]}
          />
          <Animated.View style={[styles.check, { width: animated.checkWidth }]}>
            <Animated.Text
              style={[
                styles.checkGlyph,
                { color: palette.selectedText, transform: [{ scale: animated.checkScale }] },
              ]}
            >
              ✓
            </Animated.Text>
          </Animated.View>
          <Animated.Text style={[styles.label, { color: animated.textColor }]}>
            {label}
          </Animated.Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  // userSelect keeps a quick double press on the web from selecting the label.
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    userSelect: "none",
  },
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  check: { overflow: "hidden", alignItems: "flex-start", justifyContent: "center" },
  checkGlyph: { fontSize: 14, fontWeight: "700" },
  label: { fontSize: 15, fontWeight: "600" },
});
