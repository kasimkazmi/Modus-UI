import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface RatingHistogramColors {
  bar: string;
  track: string;
  text: string;
  average: string;
}

const DEFAULT_COLORS: RatingHistogramColors = {
  bar: "#f59e0b",
  track: "#e5e7eb",
  text: "#6b7280",
  average: "#111827",
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

export interface RatingHistogramProps {
  /** How many ratings each star level got, from one star up to five. */
  counts: [number, number, number, number, number];
  /** Shows the average and the total beside the bars. */
  showAverage?: boolean;
  colors?: Partial<RatingHistogramColors>;
  style?: StyleProp<ViewStyle>;
}

function Row({
  stars,
  share,
  count,
  palette,
  reduceMotion,
}: {
  stars: number;
  share: number;
  count: number;
  palette: RatingHistogramColors;
  reduceMotion: boolean;
}) {
  const fill = useRef(new Animated.Value(share)).current;
  useEffect(() => {
    if (reduceMotion) fill.setValue(share);
    else
      Animated.timing(fill, {
        toValue: share,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
  }, [share, reduceMotion, fill]);
  return (
    <View
      accessible
      accessibilityLabel={`${stars} star${stars > 1 ? "s" : ""}: ${count} rating${count === 1 ? "" : "s"}`}
      style={styles.row}
    >
      <Text style={[styles.star, { color: palette.text }]}>{stars}★</Text>
      <View style={[styles.track, { backgroundColor: palette.track }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: palette.bar,
              width: fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            },
          ]}
        />
      </View>
      <Text style={[styles.count, { color: palette.text }]}>{count}</Text>
    </View>
  );
}

/**
 * The breakdown of ratings you see on a product page: one bar per star level that grows to its share
 * of all ratings, with the average beside them. Bars animate to new counts, and each row reads out
 * as "4 stars: 12 ratings".
 */
export function RatingHistogram({
  counts,
  showAverage = true,
  colors,
  style,
}: RatingHistogramProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const total = counts.reduce((sum, n) => sum + n, 0);
  const average = total ? counts.reduce((sum, n, i) => sum + n * (i + 1), 0) / total : 0;

  return (
    <View style={[styles.root, style]}>
      {showAverage ? (
        <View
          accessible
          accessibilityLabel={`Average ${average.toFixed(1)} out of 5 from ${total} rating${total === 1 ? "" : "s"}`}
          style={styles.summary}
        >
          <Text style={[styles.average, { color: palette.average }]}>{average.toFixed(1)}</Text>
          <Text style={[styles.total, { color: palette.text }]}>{total} ratings</Text>
        </View>
      ) : null}
      <View style={styles.bars}>
        {[5, 4, 3, 2, 1].map((stars) => (
          <Row
            key={stars}
            stars={stars}
            count={counts[stars - 1]}
            share={total ? counts[stars - 1] / total : 0}
            palette={palette}
            reduceMotion={reduceMotion}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", gap: 20 },
  summary: { alignItems: "center", gap: 2 },
  average: { fontSize: 44, fontWeight: "800" },
  total: { fontSize: 12 },
  bars: { flex: 1, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  star: { width: 28, fontSize: 13 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  count: { width: 32, fontSize: 13, textAlign: "right" },
});
