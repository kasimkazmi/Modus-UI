import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const DEFAULT_WIDTH = 120;
const NATIVE_DRIVER = Platform.OS !== "web";

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

// The arrow stays mounted and turns between ascending and descending.
function SortArrow({ direction, color }: { direction: "asc" | "desc"; color: string }) {
  const reduceMotion = useReduceMotion();
  const turn = useRef(new Animated.Value(direction === "asc" ? 0 : 1)).current;
  useEffect(() => {
    const toValue = direction === "asc" ? 0 : 1;
    if (reduceMotion) turn.setValue(toValue);
    else Animated.timing(turn, { toValue, duration: 180, useNativeDriver: NATIVE_DRIVER }).start();
  }, [direction, reduceMotion, turn]);
  return (
    <Animated.Text
      style={{
        color,
        fontSize: 13,
        fontWeight: "700",
        transform: [
          { rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) },
        ],
      }}
    >
      ↑
    </Animated.Text>
  );
}

export interface DataTableColumn<T> {
  key: keyof T & string;
  title: string;
  width?: number;
  align?: "left" | "right";
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

export interface DataTableColors {
  header: string;
  headerText: string;
  text: string;
  border: string;
  stripe: string;
  background: string;
}

const DEFAULT_COLORS: DataTableColors = {
  header: "#f3f4f6",
  headerText: "#374151",
  text: "#111827",
  border: "#e5e7eb",
  stripe: "#f9fafb",
  background: "#ffffff",
};

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Returns a unique key for a row. */
  rowKey: (row: T) => string;
  /** Column key and direction to sort by at first. */
  initialSort?: { key: string; direction: "asc" | "desc" };
  onRowPress?: (row: T) => void;
  /** Shades every other row. */
  striped?: boolean;
  /** Height of the rows area; the header stays above it while the rows scroll. */
  maxHeight?: number;
  colors?: Partial<DataTableColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A table that scrolls sideways when its columns are wider than the screen and keeps its header
 * visible while the rows scroll up and down. Tapping a sortable header sorts by it, then reverses,
 * and the arrow turns to match. Headers report their sort order to screen readers.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  initialSort,
  onRowPress,
  striped = true,
  maxHeight = 280,
  colors,
  style,
}: DataTableProps<T>) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const [sort, setSort] = useState(initialSort);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const key = sort.key as keyof T;
    const sign = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = a[key];
      const y = b[key];
      if (typeof x === "number" && typeof y === "number") return (x - y) * sign;
      return String(x).localeCompare(String(y)) * sign;
    });
  }, [rows, sort]);

  const toggle = (key: string) =>
    setSort((now) =>
      now?.key === key
        ? { key, direction: now.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );

  const total = columns.reduce((sum, column) => sum + (column.width ?? DEFAULT_WIDTH), 0);

  return (
    <View
      style={[
        styles.root,
        { borderColor: palette.border, backgroundColor: palette.background },
        style,
      ]}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: total }}>
          <View
            accessibilityRole="header"
            style={[styles.row, { backgroundColor: palette.header }]}
          >
            {columns.map((column) => {
              const active = sort?.key === column.key;
              const direction = active ? sort.direction : undefined;
              const cell = (
                <View style={[styles.head, column.align === "right" && styles.headRight]}>
                  <Text numberOfLines={1} style={[styles.headText, { color: palette.headerText }]}>
                    {column.title}
                  </Text>
                  {direction ? (
                    <SortArrow direction={direction} color={palette.headerText} />
                  ) : null}
                </View>
              );
              const box = { width: column.width ?? DEFAULT_WIDTH };
              return column.sortable ? (
                <Pressable
                  key={column.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Sort by ${column.title}`}
                  aria-sort={
                    direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"
                  }
                  onPress={() => toggle(column.key)}
                  style={[styles.cell, box]}
                >
                  {cell}
                </Pressable>
              ) : (
                <View key={column.key} style={[styles.cell, box]}>
                  {cell}
                </View>
              );
            })}
          </View>
          <ScrollView style={{ maxHeight }} nestedScrollEnabled>
            {sorted.map((row, index) => (
              <Pressable
                key={rowKey(row)}
                accessibilityRole={onRowPress ? "button" : undefined}
                disabled={!onRowPress}
                onPress={() => onRowPress?.(row)}
                style={[
                  styles.row,
                  { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth },
                  striped && index % 2 === 1 && { backgroundColor: palette.stripe },
                ]}
              >
                {columns.map((column) => (
                  <View
                    key={column.key}
                    style={[styles.cell, { width: column.width ?? DEFAULT_WIDTH }]}
                  >
                    {column.render ? (
                      column.render(row)
                    ) : (
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.text,
                          { color: palette.text },
                          column.align === "right" && styles.right,
                        ]}
                      >
                        {String(row[column.key])}
                      </Text>
                    )}
                  </View>
                ))}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  row: { flexDirection: "row" },
  cell: { minHeight: 44, paddingHorizontal: 12, justifyContent: "center", userSelect: "none" },
  head: { flexDirection: "row", alignItems: "center", gap: 4 },
  headRight: { justifyContent: "flex-end" },
  headText: { fontSize: 13, fontWeight: "700" },
  text: { fontSize: 14 },
  right: { textAlign: "right" },
});
