import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
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
const ROW = 44;
const ROWS = 6;

export interface MonthGridColors {
  text: string;
  mutedText: string;
  pill: string;
  pillText: string;
  today: string;
  dot: string;
}

const DEFAULT_COLORS: MonthGridColors = {
  text: "#111827",
  mutedText: "#9ca3af",
  pill: "#4f46e5",
  pillText: "#ffffff",
  today: "#4f46e5",
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
/** YYYY-MM-DD for a local date. Dates here are local, never UTC, so a day cannot shift. */
const toISO = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const toMonth = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
/** The first day of a YYYY-MM month, as a local date. */
const firstOf = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1);
};
const addMonths = (month: string, delta: number) => {
  const first = firstOf(month);
  return toMonth(new Date(first.getFullYear(), first.getMonth() + delta, 1));
};

export interface MonthGridProps {
  /** The month shown, as YYYY-MM. */
  month: string;
  onMonthChange: (month: string) => void;
  /** The selected day, as YYYY-MM-DD, or null for none. */
  selected: string | null;
  onSelect: (date: string) => void;
  /** Days (YYYY-MM-DD) that show a small dot, for example days with events. */
  marked?: string[];
  /** The first column: 1 for Monday, 0 for Sunday. */
  weekStart?: 0 | 1;
  colors?: Partial<MonthGridColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A month calendar. A pill glides to the selected day, the grid slides in from the side when the
 * month changes, and a horizontal swipe changes the month too. Days outside the month are faded but
 * still selectable. Dates are local YYYY-MM-DD strings, so nothing shifts a day across time zones.
 */
export function MonthGrid({
  month,
  onMonthChange,
  selected,
  onSelect,
  marked,
  weekStart = 1,
  colors,
  style,
}: MonthGridProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const pill = useRef(new Animated.ValueXY()).current;
  const pillOn = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const previousMonth = useRef(month);
  const placed = useRef(false);
  // True during a swipe and for a moment after it: the click that follows a mouse drag is not a tap.
  const dragging = useRef(false);

  const live = useRef({ month, onMonthChange });
  live.current = { month, onMonthChange };

  const todayISO = useMemo(() => toISO(new Date()), []);
  const markedSet = useMemo(() => new Set(marked), [marked]);
  const title = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(firstOf(month)),
    [month],
  );
  const weekdays = useMemo(() => {
    const format = new Intl.DateTimeFormat(undefined, { weekday: "narrow" });
    const spoken = new Intl.DateTimeFormat(undefined, { weekday: "long" });
    // 2023-01-01 was a Sunday.
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(2023, 0, 1 + ((i + weekStart) % 7));
      return { short: format.format(date), long: spoken.format(date) };
    });
  }, [weekStart]);
  const spokenDay = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const cells = useMemo(() => {
    const first = firstOf(month);
    const lead = (first.getDay() - weekStart + 7) % 7;
    return Array.from({ length: ROWS * 7 }, (_, i) => {
      const date = new Date(first.getFullYear(), first.getMonth(), 1 - lead + i);
      return { iso: toISO(date), date, inMonth: toMonth(date) === month };
    });
  }, [month, weekStart]);

  const cell = width / 7;
  const selectedIndex = selected ? cells.findIndex((c) => c.iso === selected) : -1;

  // The pill glides to the selected day, or fades out when it is not on this page.
  useEffect(() => {
    if (cell <= 0) return;
    const to = { x: (selectedIndex % 7) * cell, y: Math.floor(selectedIndex / 7) * ROW };
    if (selectedIndex < 0) {
      Animated.timing(pillOn, {
        toValue: 0,
        duration: 120,
        useNativeDriver: NATIVE_DRIVER,
      }).start();
      return;
    }
    if (!placed.current || reduceMotion) {
      placed.current = true;
      pill.setValue(to);
      pillOn.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.spring(pill, {
        toValue: to,
        stiffness: 420,
        damping: 30,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.timing(pillOn, { toValue: 1, duration: 120, useNativeDriver: NATIVE_DRIVER }),
    ]).start();
  }, [selectedIndex, cell, reduceMotion, pill, pillOn]);

  // The grid slides in from the side the new month lies on.
  useEffect(() => {
    if (previousMonth.current === month) return;
    const direction = month > previousMonth.current ? 1 : -1;
    previousMonth.current = month;
    if (reduceMotion) return;
    slide.setValue(direction * 28);
    fade.setValue(0);
    Animated.parallel([
      Animated.spring(slide, {
        toValue: 0,
        stiffness: 320,
        damping: 28,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: NATIVE_DRIVER }),
    ]).start();
  }, [month, reduceMotion, slide, fade]);

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderGrant: () => {
        dragging.current = true;
      },
      onPanResponderRelease: (_, g) => {
        setTimeout(() => (dragging.current = false), 80);
        if (Math.abs(g.dx) < 50 && Math.abs(g.vx) < 0.5) return;
        live.current.onMonthChange(addMonths(live.current.month, g.dx < 0 ? 1 : -1));
      },
      onPanResponderTerminate: () => setTimeout(() => (dragging.current = false), 80),
    }),
  ).current;

  const nav = (label: string, glyph: string, delta: number) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => onMonthChange(addMonths(month, delta))}
      style={({ pressed }) => [styles.nav, pressed && styles.dim]}
    >
      <Text style={[styles.navGlyph, { color: palette.text }]}>{glyph}</Text>
    </Pressable>
  );

  return (
    <View style={style}>
      <View style={styles.header}>
        {nav("Previous month", "‹", -1)}
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={[styles.title, { color: palette.text }]}
        >
          {title}
        </Text>
        {nav("Next month", "›", 1)}
      </View>
      <View style={styles.week}>
        {weekdays.map((day, i) => (
          <Text
            key={`${i}-${day.long}`}
            accessibilityLabel={day.long}
            style={[styles.weekday, { color: palette.mutedText }]}
          >
            {day.short}
          </Text>
        ))}
      </View>
      <View
        {...swipe.panHandlers}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        style={styles.gridWrap}
      >
        <Animated.View
          style={{ height: ROW * ROWS, opacity: fade, transform: [{ translateX: slide }] }}
        >
          {cell > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pill,
                {
                  width: cell,
                  height: ROW,
                  opacity: pillOn,
                  transform: [{ translateX: pill.x }, { translateY: pill.y }],
                },
              ]}
            >
              <View style={[styles.pillInner, { backgroundColor: palette.pill }]} />
            </Animated.View>
          ) : null}
          <View style={styles.cells}>
            {cells.map(({ iso, date, inMonth }) => {
              const isSelected = iso === selected;
              const isToday = iso === todayISO;
              const hasEvents = markedSet.has(iso);
              return (
                <Pressable
                  key={iso}
                  accessibilityRole="button"
                  accessibilityLabel={`${spokenDay.format(date)}${hasEvents ? ", has events" : ""}`}
                  accessibilityState={{ selected: isSelected }}
                  aria-selected={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  onPress={() => {
                    if (dragging.current) return;
                    if (!inMonth) onMonthChange(toMonth(date));
                    onSelect(iso);
                  }}
                  style={[styles.cell, { width: `${100 / 7}%` }]}
                >
                  <View
                    style={[
                      styles.day,
                      isToday && !isSelected && { borderColor: palette.today, borderWidth: 1.5 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: isSelected
                            ? palette.pillText
                            : inMonth
                              ? palette.text
                              : palette.mutedText,
                          fontWeight: isSelected || isToday ? "800" : "500",
                        },
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: palette.dot, opacity: hasEvents ? 1 : 0 },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  nav: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
  },
  navGlyph: { fontSize: 28, lineHeight: 30, fontWeight: "600" },
  dim: { opacity: 0.5 },
  title: { fontSize: 17, fontWeight: "800" },
  week: { flexDirection: "row", marginBottom: 4 },
  weekday: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "700" },
  gridWrap: { overflow: "hidden", userSelect: "none" },
  cells: { flexDirection: "row", flexWrap: "wrap" },
  cell: { height: ROW, alignItems: "center", justifyContent: "center" },
  day: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "transparent",
    borderWidth: 1.5,
  },
  dayText: { fontSize: 15 },
  dot: { position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: 2 },
  pill: { position: "absolute", top: 0, left: 0, alignItems: "center", justifyContent: "center" },
  pillInner: { width: 34, height: 34, borderRadius: 17 },
});
