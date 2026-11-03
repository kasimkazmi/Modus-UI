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

export interface SelectOption {
  id: string;
  label: string;
  /** A glyph or emoji drawn above the label. */
  icon?: string;
}

export interface SelectGridColors {
  accent: string;
  border: string;
  surface: string;
  selectedSurface: string;
  label: string;
  checkText: string;
}

const DEFAULT_COLORS: SelectGridColors = {
  accent: "#4f46e5",
  border: "#e5e7eb",
  surface: "#ffffff",
  selectedSurface: "#eef2ff",
  label: "#111827",
  checkText: "#ffffff",
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

export interface SelectGridProps {
  options: SelectOption[];
  /** The ids of the selected options. */
  value: string[];
  onChange: (value: string[]) => void;
  /** Cards per row. */
  columns?: number;
  /** The most cards that can be selected; further taps are ignored until one is cleared. */
  max?: number;
  colors?: Partial<SelectGridColors>;
  style?: StyleProp<ViewStyle>;
}

interface CardProps {
  option: SelectOption;
  selected: boolean;
  blocked: boolean;
  palette: SelectGridColors;
  reduceMotion: boolean;
  onPress: () => void;
}

function Card({ option, selected, blocked, palette, reduceMotion, onPress }: CardProps) {
  const check = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) check.setValue(selected ? 1 : 0);
    else
      Animated.spring(check, {
        toValue: selected ? 1 : 0,
        stiffness: 480,
        damping: 22,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }).start();
  }, [selected, reduceMotion, check]);

  const dip = (down: boolean) => {
    if (reduceMotion) return;
    Animated.spring(press, {
      toValue: down ? 0.96 : 1,
      stiffness: 500,
      damping: 26,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={option.label}
      accessibilityState={{ checked: selected, disabled: blocked }}
      aria-checked={selected}
      aria-disabled={blocked}
      onPress={onPress}
      onPressIn={() => dip(true)}
      onPressOut={() => dip(false)}
      style={styles.cell}
    >
      <Animated.View
        style={[
          styles.card,
          {
            borderColor: selected ? palette.accent : palette.border,
            backgroundColor: selected ? palette.selectedSurface : palette.surface,
            opacity: blocked ? 0.45 : 1,
            transform: [{ scale: press }],
          },
        ]}
      >
        {option.icon ? <Text style={styles.icon}>{option.icon}</Text> : null}
        <Text style={[styles.label, { color: palette.label }]}>{option.label}</Text>
        <Animated.View
          style={[
            styles.badge,
            { backgroundColor: palette.accent, opacity: check, transform: [{ scale: check }] },
          ]}
        >
          <Text style={[styles.tick, { color: palette.checkText }]}>✓</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * A grid of cards where any number can be picked, such as interests during onboarding. A picked card
 * takes the accent border and a tick springs into its corner. Set `max` and the remaining cards dim
 * once the limit is reached. Every card is a checkbox for screen readers.
 */
export function SelectGrid({
  options,
  value,
  onChange,
  columns = 2,
  max,
  colors,
  style,
}: SelectGridProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const full = max !== undefined && value.length >= max;

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (!full) onChange([...value, id]);
  };

  return (
    <View accessibilityRole="list" style={[styles.grid, style]}>
      {options.map((option) => {
        const selected = value.includes(option.id);
        return (
          <View key={option.id} style={{ width: `${100 / columns}%` }}>
            <Card
              option={option}
              selected={selected}
              blocked={full && !selected}
              palette={palette}
              reduceMotion={reduceMotion}
              onPress={() => toggle(option.id)}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", margin: -5 },
  cell: { padding: 5, userSelect: "none" },
  card: {
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
  },
  icon: { fontSize: 28 },
  label: { fontSize: 15, fontWeight: "600" },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tick: { fontSize: 12, fontWeight: "800" },
});
