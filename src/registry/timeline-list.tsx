import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const DOT = 16;

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  /** Shown beside the title, such as a time or date. */
  time?: string;
  status: "done" | "current" | "upcoming";
}

export interface TimelineListColors {
  line: string;
  done: string;
  current: string;
  upcoming: string;
  title: string;
  description: string;
}

const DEFAULT_COLORS: TimelineListColors = {
  line: "#e5e7eb",
  done: "#16a34a",
  current: "#4f46e5",
  upcoming: "#d1d5db",
  title: "#111827",
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

export interface TimelineListProps {
  items: TimelineItem[];
  colors?: Partial<TimelineListColors>;
  style?: StyleProp<ViewStyle>;
}

function Pulse({ color, reduceMotion }: { color: string; reduceMotion: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      t.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: DOT,
        height: DOT,
        borderRadius: DOT / 2,
        backgroundColor: color,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
      }}
    />
  );
}

/**
 * A vertical list of events joined by a line. Finished steps are green, the current step has a dot
 * that pulses outward, and later steps are muted. Each row reads out its status, so the progress does
 * not depend on colour alone. With reduced motion the pulse stands still.
 */
export function TimelineList({ items, colors, style }: TimelineListProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const status = { done: "Completed", current: "In progress", upcoming: "Upcoming" };

  return (
    <View accessibilityRole="list" style={style}>
      {items.map((item, index) => {
        const tint = palette[item.status];
        const last = index === items.length - 1;
        return (
          <View
            key={item.id}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`${item.title}, ${status[item.status]}${item.time ? `, ${item.time}` : ""}`}
            style={styles.row}
          >
            <View style={styles.rail}>
              <View style={styles.dotBox}>
                {item.status === "current" ? (
                  <Pulse color={tint} reduceMotion={reduceMotion} />
                ) : null}
                <View
                  style={[
                    styles.dot,
                    item.status === "upcoming"
                      ? { borderWidth: 2, borderColor: tint, backgroundColor: "transparent" }
                      : { backgroundColor: tint },
                  ]}
                />
              </View>
              {last ? null : (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: item.status === "done" ? palette.done : palette.line },
                  ]}
                />
              )}
            </View>
            <View style={[styles.body, last && styles.lastBody]}>
              <View style={styles.head}>
                <Text
                  style={[
                    styles.title,
                    { color: item.status === "upcoming" ? palette.description : palette.title },
                  ]}
                >
                  {item.title}
                </Text>
                {item.time ? (
                  <Text style={[styles.time, { color: palette.description }]}>{item.time}</Text>
                ) : null}
              </View>
              {item.description ? (
                <Text style={[styles.description, { color: palette.description }]}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14 },
  rail: { width: DOT, alignItems: "center" },
  dotBox: { width: DOT, height: DOT, marginTop: 3, alignItems: "center", justifyContent: "center" },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  line: { flex: 1, width: 2, marginVertical: 4 },
  body: { flex: 1, gap: 2, paddingBottom: 22 },
  lastBody: { paddingBottom: 0 },
  head: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: "600" },
  time: { fontSize: 13 },
  description: { fontSize: 14, lineHeight: 20 },
});
