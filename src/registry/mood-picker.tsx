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

export interface MoodPickerColors {
  accent: string;
  surface: string;
  text: string;
}

const DEFAULT_COLORS: MoodPickerColors = {
  accent: "#eef2ff",
  surface: "#f3f4f6",
  text: "#374151",
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

export interface MoodPickerProps {
  /** The chosen index, or null for none. */
  value: number | null;
  onChange: (index: number) => void;
  /** One glyph per level, worst first. */
  icons?: string[];
  /** One spoken name per level, matching icons. */
  labels?: string[];
  colors?: Partial<MoodPickerColors>;
  style?: StyleProp<ViewStyle>;
}

const ICONS = ["😡", "🙁", "😐", "🙂", "😍"];
const LABELS = ["Awful", "Bad", "Okay", "Good", "Great"];

function Face({
  icon,
  label,
  selected,
  dimmed,
  palette,
  reduceMotion,
  onPress,
  index,
  count,
}: {
  icon: string;
  label: string;
  selected: boolean;
  dimmed: boolean;
  palette: MoodPickerColors;
  reduceMotion: boolean;
  onPress: () => void;
  index: number;
  count: number;
}) {
  const grow = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) grow.setValue(selected ? 1 : 0);
    else
      Animated.spring(grow, {
        toValue: selected ? 1 : 0,
        stiffness: 420,
        damping: 15,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }).start();
  }, [selected, reduceMotion, grow]);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      aria-posinset={index + 1}
      aria-setsize={count}
      onPress={onPress}
      style={styles.face}
    >
      <Animated.View
        style={[
          styles.bubble,
          {
            backgroundColor: selected ? palette.accent : palette.surface,
            opacity: dimmed ? 0.45 : 1,
            transform: [
              { scale: grow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) },
            ],
          },
        ]}
      >
        <Text style={styles.icon}>{icon}</Text>
      </Animated.View>
      <Text style={[styles.label, { color: palette.text, opacity: selected ? 1 : 0 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * A row of faces for rating how something felt, from awful to great. The chosen face swells with a
 * bounce and its name appears beneath it while the others dim. The faces form a radio group, so a
 * screen reader reads each name and which one is chosen.
 */
export function MoodPicker({
  value,
  onChange,
  icons = ICONS,
  labels = LABELS,
  colors,
  style,
}: MoodPickerProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="How was it?"
      style={[styles.row, style]}
    >
      {icons.map((icon, i) => (
        <Face
          key={i}
          icon={icon}
          label={labels[i] ?? String(i + 1)}
          index={i}
          count={icons.length}
          selected={value === i}
          dimmed={value !== null && value !== i}
          palette={palette}
          reduceMotion={reduceMotion}
          onPress={() => onChange(i)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  face: { alignItems: "center", gap: 8, userSelect: "none" },
  bubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 28 },
  label: { fontSize: 12, fontWeight: "700" },
});
