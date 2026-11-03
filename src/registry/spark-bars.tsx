import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface SparkBarsColors {
  bar: string;
  active: string;
}

const DEFAULT_COLORS: SparkBarsColors = {
  bar: "#c7d2fe",
  active: "#4f46e5",
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

export interface SparkBarsProps {
  /** One value per bar; the tallest sets the scale. */
  values: number[];
  /** Height of the tallest bar. */
  height?: number;
  /** Space between bars. */
  gap?: number;
  /** Index of the bar drawn in the active colour; defaults to the last. */
  highlight?: number;
  /** Spoken name of the chart. */
  label?: string;
  colors?: Partial<SparkBarsColors>;
  style?: StyleProp<ViewStyle>;
}

function Bar({
  share,
  height,
  color,
  index,
  reduceMotion,
}: {
  share: number;
  height: number;
  color: string;
  index: number;
  reduceMotion: boolean;
}) {
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      grow.setValue(share);
      return;
    }
    Animated.timing(grow, {
      toValue: share,
      duration: 420,
      delay: index * 40,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [share, index, reduceMotion, grow]);
  return (
    <Animated.View
      style={{
        flex: 1,
        borderRadius: 4,
        backgroundColor: color,
        height: grow.interpolate({ inputRange: [0, 1], outputRange: [3, height] }),
      }}
    />
  );
}

/**
 * A tiny bar chart for showing a trend inside a card. The bars grow up from the baseline one after
 * another, resize when the values change, and the active bar takes the accent colour. It reads out as
 * an image with every value listed, since the bars carry no labels.
 */
export function SparkBars({
  values,
  height = 48,
  gap = 4,
  highlight,
  label = "Chart",
  colors,
  style,
}: SparkBarsProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const top = Math.max(...values, 1);
  const active = highlight ?? values.length - 1;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${label}: ${values.join(", ")}`}
      aria-label={`${label}: ${values.join(", ")}`}
      style={[styles.row, { height, gap }, style]}
    >
      {values.map((value, i) => (
        <Bar
          key={i}
          index={i}
          share={Math.max(0, value) / top}
          height={height}
          color={i === active ? palette.active : palette.bar}
          reduceMotion={reduceMotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end" },
});
