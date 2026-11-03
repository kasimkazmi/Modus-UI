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

export interface Swatch {
  /** A CSS colour such as "#ef4444". */
  value: string;
  /** Spoken name, such as "Red". */
  label: string;
}

export interface SwatchPickerColors {
  ring: string;
  check: string;
}

const DEFAULT_COLORS: SwatchPickerColors = {
  ring: "#111827",
  check: "#ffffff",
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

export interface SwatchPickerProps {
  options: Swatch[];
  /** The chosen swatch's colour value. */
  value: string;
  onChange: (value: string) => void;
  /** Diameter of a swatch. */
  size?: number;
  colors?: Partial<SwatchPickerColors>;
  style?: StyleProp<ViewStyle>;
}

function Dot({
  swatch,
  selected,
  size,
  palette,
  reduceMotion,
  onPress,
  index,
  count,
}: {
  swatch: Swatch;
  selected: boolean;
  size: number;
  palette: SwatchPickerColors;
  reduceMotion: boolean;
  onPress: () => void;
  index: number;
  count: number;
}) {
  const pick = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) pick.setValue(selected ? 1 : 0);
    else
      Animated.spring(pick, {
        toValue: selected ? 1 : 0,
        stiffness: 420,
        damping: 18,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }).start();
  }, [selected, reduceMotion, pick]);

  const outer = size + 12;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={swatch.label}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      aria-posinset={index + 1}
      aria-setsize={count}
      onPress={onPress}
      style={{ width: outer, height: outer, alignItems: "center", justifyContent: "center" }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          borderWidth: 2,
          borderColor: palette.ring,
          opacity: pick,
          transform: [{ scale: pick.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: swatch.value,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.Text
          style={{
            color: palette.check,
            fontSize: size * 0.45,
            fontWeight: "800",
            opacity: pick,
            transform: [{ scale: pick }],
          }}
        >
          ✓
        </Animated.Text>
      </View>
    </Pressable>
  );
}

/**
 * A row of colour circles to choose from, such as a theme or a label colour. The chosen one gets a ring
 * that springs out around it and a tick inside. The circles are a radio group and each is read out by
 * the name you give it, not by its hex code.
 */
export function SwatchPicker({
  options,
  value,
  onChange,
  size = 36,
  colors,
  style,
}: SwatchPickerProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Colour" style={[styles.row, style]}>
      {options.map((swatch, i) => (
        <Dot
          key={swatch.value}
          swatch={swatch}
          index={i}
          count={options.length}
          selected={swatch.value === value}
          size={size}
          palette={palette}
          reduceMotion={reduceMotion}
          onPress={() => onChange(swatch.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 2, userSelect: "none" },
});
