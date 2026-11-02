import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface PageDotsColors {
  active: string;
  inactive: string;
}

const DEFAULT_COLORS: PageDotsColors = {
  active: "#4f46e5",
  inactive: "#d1d5db",
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

export interface PageDotsProps {
  /** How many pages there are. */
  count: number;
  /** The page showing now, from 0. */
  index: number;
  /** Makes each dot tappable and calls this with the page it stands for. */
  onIndexChange?: (index: number) => void;
  /** Diameter of a dot. */
  dotSize?: number;
  colors?: Partial<PageDotsColors>;
  style?: StyleProp<ViewStyle>;
}

interface DotProps {
  active: boolean;
  size: number;
  page: number;
  count: number;
  palette: PageDotsColors;
  reduceMotion: boolean;
  onPress?: () => void;
}

function Dot({ active, size, page, count, palette, reduceMotion, onPress }: DotProps) {
  const grow = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) grow.setValue(active ? 1 : 0);
    else
      Animated.timing(grow, {
        toValue: active ? 1 : 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
  }, [active, reduceMotion, grow]);

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`Page ${page + 1} of ${count}`}
      accessibilityState={{ selected: active }}
      aria-current={active ? "step" : undefined}
      disabled={!onPress}
      hitSlop={6}
      onPress={onPress}
    >
      <Animated.View
        style={{
          height: size,
          borderRadius: size / 2,
          width: grow.interpolate({ inputRange: [0, 1], outputRange: [size, size * 3] }),
          backgroundColor: grow.interpolate({
            inputRange: [0, 1],
            outputRange: [palette.inactive, palette.active],
          }),
        }}
      />
    </Pressable>
  );
}

/**
 * The row of dots under a pager. The current page's dot stretches into a pill and takes the accent
 * colour while the others shrink back to circles. Give it `onIndexChange` and the dots become buttons.
 */
export function PageDots({
  count,
  index,
  onIndexChange,
  dotSize = 8,
  colors,
  style,
}: PageDotsProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();

  return (
    <View
      accessible
      accessibilityLabel={`Page ${index + 1} of ${count}`}
      aria-label={`Page ${index + 1} of ${count}`}
      style={[styles.row, { gap: dotSize * 0.75 }, style]}
    >
      {Array.from({ length: count }, (_, i) => (
        <Dot
          key={i}
          page={i}
          count={count}
          active={i === index}
          size={dotSize}
          palette={palette}
          reduceMotion={reduceMotion}
          onPress={onIndexChange ? () => onIndexChange(i) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", alignSelf: "center" },
});
