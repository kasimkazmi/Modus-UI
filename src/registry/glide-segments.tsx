import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const PADDING = 3;

export interface GlideSegmentsOption {
  value: string;
  label: string;
}

export interface GlideSegmentsColors {
  track: string;
  thumb: string;
  text: string;
  selectedText: string;
}

const DEFAULT_COLORS: GlideSegmentsColors = {
  track: "#e5e7eb",
  thumb: "#ffffff",
  text: "#6b7280",
  selectedText: "#111827",
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

export interface GlideSegmentsProps {
  options: GlideSegmentsOption[];
  value: string;
  onChange: (value: string) => void;
  /** Height of the control. */
  height?: number;
  colors?: Partial<GlideSegmentsColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A segmented control whose thumb glides between options on a spring and stretches slightly as it
 * travels. Segments share the width equally, take the full touch target, and read as tabs to
 * screen readers.
 */
export function GlideSegments({
  options,
  value,
  onChange,
  height = 40,
  colors,
  style,
}: GlideSegmentsProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const stretch = useRef(new Animated.Value(1)).current;

  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const segment = options.length > 0 ? (width - PADDING * 2) / options.length : 0;

  useEffect(() => {
    if (segment === 0) return;
    const target = index * segment;
    if (reduceMotion) {
      x.setValue(target);
      return;
    }
    Animated.parallel([
      Animated.spring(x, {
        toValue: target,
        stiffness: 420,
        damping: 32,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.sequence([
        Animated.timing(stretch, { toValue: 1.12, duration: 110, useNativeDriver: NATIVE_DRIVER }),
        Animated.spring(stretch, {
          toValue: 1,
          stiffness: 300,
          damping: 20,
          mass: 1,
          useNativeDriver: NATIVE_DRIVER,
        }),
      ]),
    ]).start();
  }, [index, segment, reduceMotion, x, stretch]);

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: palette.track },
        style,
      ]}
    >
      {segment > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              width: segment,
              borderRadius: (height - PADDING * 2) / 2,
              backgroundColor: palette.thumb,
              transform: [{ translateX: x }, { scaleX: stretch }],
            },
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            aria-selected={selected}
            onPress={() => onChange(option.value)}
            style={styles.segment}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, { color: selected ? palette.selectedText : palette.text }]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", padding: PADDING, userSelect: "none" },
  thumb: {
    position: "absolute",
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.16)",
  },
  segment: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  label: { fontSize: 14, fontWeight: "600" },
});
