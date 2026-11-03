import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface ChecklistItem {
  id: string;
  label: string;
}

export interface TaskChecklistColors {
  accent: string;
  text: string;
  done: string;
  track: string;
  border: string;
}

const DEFAULT_COLORS: TaskChecklistColors = {
  accent: "#4f46e5",
  text: "#111827",
  done: "#9ca3af",
  track: "#e5e7eb",
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

export interface TaskChecklistProps {
  items: ChecklistItem[];
  /** The ids of the finished tasks. */
  value: string[];
  onChange: (value: string[]) => void;
  colors?: Partial<TaskChecklistColors>;
  style?: StyleProp<ViewStyle>;
}

function Row({
  item,
  done,
  palette,
  reduceMotion,
  onToggle,
}: {
  item: ChecklistItem;
  done: boolean;
  palette: TaskChecklistColors;
  reduceMotion: boolean;
  onToggle: () => void;
}) {
  const t = useRef(new Animated.Value(done ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) t.setValue(done ? 1 : 0);
    else
      Animated.timing(t, {
        toValue: done ? 1 : 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
  }, [done, reduceMotion, t]);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={item.label}
      accessibilityState={{ checked: done }}
      aria-checked={done}
      onPress={onToggle}
      style={styles.row}
    >
      <Animated.View
        style={[
          styles.box,
          {
            borderColor: t.interpolate({
              inputRange: [0, 1],
              outputRange: [palette.border, palette.accent],
            }),
            backgroundColor: t.interpolate({
              inputRange: [0, 1],
              outputRange: ["rgba(0,0,0,0)", palette.accent],
            }),
          },
        ]}
      >
        <Animated.Text style={[styles.tick, { opacity: t }]}>✓</Animated.Text>
      </Animated.View>
      <View style={styles.labelBox}>
        <Animated.Text
          style={[
            styles.label,
            {
              color: t.interpolate({
                inputRange: [0, 1],
                outputRange: [palette.text, palette.done],
              }),
            },
          ]}
        >
          {item.label}
        </Animated.Text>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.strike,
            {
              backgroundColor: palette.done,
              width: t.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

/**
 * A to-do list with a progress bar above it. Ticking a task fills its box, greys its text and draws a
 * line through it from left to right, and the bar grows to the share of tasks finished. Each task is
 * a checkbox, and the progress is read out as "2 of 4 done".
 */
export function TaskChecklist({ items, value, onChange, colors, style }: TaskChecklistProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const share = items.length
    ? value.filter((id) => items.some((item) => item.id === id)).length / items.length
    : 0;
  const bar = useRef(new Animated.Value(share)).current;
  const finished = Math.round(share * items.length);

  useEffect(() => {
    if (reduceMotion) bar.setValue(share);
    else
      Animated.timing(bar, {
        toValue: share,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
  }, [share, reduceMotion, bar]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <View style={[styles.root, style]}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${finished} of ${items.length} done`}
        accessibilityValue={{ min: 0, max: items.length, now: finished }}
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={finished}
        aria-valuetext={`${finished} of ${items.length} done`}
        style={styles.progress}
      >
        <View style={[styles.track, { backgroundColor: palette.track }]}>
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: palette.accent,
                width: bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
              },
            ]}
          />
        </View>
        <Text style={[styles.count, { color: palette.done }]}>
          {finished}/{items.length}
        </Text>
      </View>
      {items.map((item) => (
        <Row
          key={item.id}
          item={item}
          done={value.includes(item.id)}
          palette={palette}
          reduceMotion={reduceMotion}
          onToggle={() => toggle(item.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 4 },
  progress: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  count: { fontSize: 13, fontWeight: "700", minWidth: 28, textAlign: "right" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, userSelect: "none" },
  box: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tick: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  labelBox: { flexShrink: 1, justifyContent: "center" },
  label: { fontSize: 16 },
  strike: { position: "absolute", left: 0, top: "52%", height: 2 },
});
