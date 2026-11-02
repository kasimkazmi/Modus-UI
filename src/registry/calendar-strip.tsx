import { useEffect, useMemo, useRef, useState, type ElementRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const CELL = 52;
const CELL_HEIGHT = 76;
const PILL_INSET = 4;

export interface CalendarStripColors {
  pill: string;
  text: string;
  selectedText: string;
  mutedText: string;
  dot: string;
}

const DEFAULT_COLORS: CalendarStripColors = {
  pill: "#4f46e5",
  text: "#111827",
  selectedText: "#ffffff",
  mutedText: "#6b7280",
  dot: "#f59e0b",
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

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD for a local date. Dates here are always local, never UTC, so a day never shifts. */
function toISO(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Builds a local date from YYYY-MM-DD. `new Date("YYYY-MM-DD")` would be UTC and can land on the day before. */
function fromISO(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export interface CalendarStripProps {
  /** The selected day, as YYYY-MM-DD. */
  selected: string;
  onSelect: (date: string) => void;
  /** First day shown, as YYYY-MM-DD. Defaults to today in local time. */
  startDate?: string;
  /** How many days the strip covers. */
  days?: number;
  /** Days (YYYY-MM-DD) that show a small dot, for example days with events. */
  marked?: string[];
  colors?: Partial<CalendarStripColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A horizontal strip of days. A pill glides behind the selected day on a spring, and the strip
 * scrolls to keep that day centred. Dates are local dates in YYYY-MM-DD form, so nothing shifts a
 * day near midnight or across time zones. Each day is a button that reads out its full date.
 */
export function CalendarStrip({
  selected,
  onSelect,
  startDate,
  days = 21,
  marked,
  colors,
  style,
}: CalendarStripProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const scroll = useRef<ElementRef<typeof ScrollView>>(null);
  const pillX = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  const start = startDate ?? toISO(new Date());
  const list = useMemo(() => {
    const first = fromISO(start);
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
      return { iso: toISO(date), date };
    });
  }, [start, days]);

  const weekday = useMemo(() => new Intl.DateTimeFormat(undefined, { weekday: "short" }), []);
  const spoken = useMemo(
    () => new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }),
    [],
  );
  const markedSet = useMemo(() => new Set(marked), [marked]);

  const index = list.findIndex((day) => day.iso === selected);

  useEffect(() => {
    if (index < 0 || width === 0) return;
    const target = index * CELL;
    const offset = Math.max(0, target - (width - CELL) / 2);
    if (!placed.current || reduceMotion) {
      placed.current = true;
      pillX.setValue(target);
      scroll.current?.scrollTo({ x: offset, animated: false });
      return;
    }
    Animated.spring(pillX, {
      toValue: target,
      stiffness: 420,
      damping: 30,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
    scroll.current?.scrollTo({ x: offset, animated: true });
  }, [index, width, reduceMotion, pillX]);

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={style}
    >
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ width: list.length * CELL }}
      >
        {index >= 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              {
                backgroundColor: palette.pill,
                transform: [{ translateX: pillX }],
              },
            ]}
          />
        ) : null}
        {list.map(({ iso, date }) => {
          const isSelected = iso === selected;
          const hasEvents = markedSet.has(iso);
          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityLabel={`${spoken.format(date)}${hasEvents ? ", has events" : ""}`}
              accessibilityState={{ selected: isSelected }}
              aria-selected={isSelected}
              aria-current={isSelected ? "date" : undefined}
              onPress={() => onSelect(iso)}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
            >
              <Text
                style={[
                  styles.weekday,
                  { color: isSelected ? palette.selectedText : palette.mutedText },
                ]}
              >
                {weekday.format(date)}
              </Text>
              <Text
                style={[styles.day, { color: isSelected ? palette.selectedText : palette.text }]}
              >
                {date.getDate()}
              </Text>
              <View
                style={[styles.dot, { backgroundColor: palette.dot, opacity: hasEvents ? 1 : 0 }]}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: PILL_INSET,
    width: CELL - PILL_INSET * 2,
    borderRadius: (CELL - PILL_INSET * 2) / 2,
  },
  cell: {
    width: CELL,
    height: CELL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    userSelect: "none",
  },
  pressed: { opacity: 0.7 },
  weekday: { fontSize: 11, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase" },
  day: { fontSize: 19, fontWeight: "700" },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
