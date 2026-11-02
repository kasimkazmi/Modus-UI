import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface StoryBarsColors {
  track: string;
  fill: string;
}

const DEFAULT_COLORS: StoryBarsColors = {
  track: "rgba(255, 255, 255, 0.35)",
  fill: "#ffffff",
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

export interface StoryBarsProps {
  /** How many stories there are. */
  count: number;
  /** The story showing now, from 0. */
  index: number;
  /** Called when the current story's time is up and the next one should show. */
  onIndexChange: (index: number) => void;
  /** Called when the last story's time is up. */
  onComplete?: () => void;
  /** How long each story shows, in milliseconds. */
  duration?: number;
  /** Holds the bar where it is, for example while a finger is down. */
  paused?: boolean;
  /** Height of each bar. */
  height?: number;
  /** Space between the bars. */
  gap?: number;
  colors?: Partial<StoryBarsColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * The row of progress bars at the top of a story viewer. Finished stories are full, the current one
 * fills over `duration` and then asks for the next, and the rest are empty. Pausing holds the fill in
 * place and resuming carries on from there. The position is read out as "Story 2 of 5".
 */
export function StoryBars({
  count,
  index,
  onIndexChange,
  onComplete,
  duration = 5000,
  paused = false,
  height = 3,
  gap = 4,
  colors,
  style,
}: StoryBarsProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  // One value per bar, and every bar stays mounted: an animated value stops itself when the view it
  // drives unmounts, so moving the fill to a different element between stories would freeze it.
  const bars = useMemo(
    () => Array.from({ length: count }, (_, i) => new Animated.Value(i < index ? 1 : 0)),
    // The starting fills only matter on mount; the effect below keeps them right from then on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  );
  const value = useRef(0);
  const lastIndex = useRef(index);

  const live = useRef({ count, index, onIndexChange, onComplete, duration, reduceMotion });
  live.current = { count, index, onIndexChange, onComplete, duration, reduceMotion };

  useEffect(() => {
    // Finished stories are full and later ones empty; a new story starts from nothing, while a pause
    // and resume of the same story carries on from where it stopped.
    bars.forEach((bar, i) => {
      if (i < index) bar.setValue(1);
      else if (i > index) bar.setValue(0);
    });
    const current = bars[index];
    if (!current) return;
    if (lastIndex.current !== index) {
      lastIndex.current = index;
      current.setValue(0);
    }
    value.current = (current as unknown as { __getValue: () => number }).__getValue();
    const id = current.addListener(({ value: v }) => (value.current = v));
    if (paused) return () => current.removeListener(id);
    const remaining = Math.max(0, 1 - value.current) * live.current.duration;
    const animation = Animated.timing(current, {
      toValue: 1,
      duration: remaining,
      // With reduced motion the bar moves in ten steps instead of sliding.
      easing: live.current.reduceMotion ? (t: number) => Math.floor(t * 10) / 10 : Easing.linear,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (!finished) return;
      const { index: now, count: total } = live.current;
      if (now < total - 1) live.current.onIndexChange(now + 1);
      else live.current.onComplete?.();
    });
    return () => {
      animation.stop();
      current.removeListener(id);
    };
  }, [index, paused, bars, reduceMotion]);

  const label = `Story ${index + 1} of ${count}`;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      aria-label={label}
      accessibilityValue={{ min: 1, max: count, now: index + 1, text: label }}
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={index + 1}
      aria-valuetext={label}
      style={[styles.row, { gap }, style]}
    >
      {bars.map((bar, i) => (
        <View
          key={i}
          style={[
            styles.track,
            { height, borderRadius: height / 2, backgroundColor: palette.track },
          ]}
        >
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: palette.fill,
                width: bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  track: { flex: 1, overflow: "hidden" },
  fill: { height: "100%" },
});
