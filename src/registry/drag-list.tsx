import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const HANDLE_WIDTH = 48;

export interface DragListColors {
  row: string;
  border: string;
  handle: string;
}

const DEFAULT_COLORS: DragListColors = {
  row: "#ffffff",
  border: "#e5e7eb",
  handle: "#9ca3af",
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

export interface DragListProps<T> {
  /** The items, in order. The list is controlled: it reorders only when `data` does. */
  data: T[];
  /** Renders a row's content. The grip handle is added beside it. */
  renderItem: (item: T, state: { dragging: boolean }) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  /** Called once, after a dragged row has settled, with the new order. Not called if nothing moved. */
  onReorder: (next: T[]) => void;
  /** Height of every row. Rows have a fixed height so slots can be computed exactly. */
  rowHeight?: number;
  colors?: Partial<DragListColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A reorderable list. Press the grip on a row and drag: the row lifts and follows the pointer, the
 * rows it passes spring out of the way, and on release it settles into its slot. Each grip is also
 * an accessible control with move up and move down actions, so reordering never needs a gesture.
 */
export function DragList<T>({
  data,
  renderItem,
  keyExtractor,
  onReorder,
  rowHeight = 64,
  colors,
  style,
}: DragListProps<T>) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const keys = data.map((item, index) => keyExtractor(item, index));
  const order = keys.join("\u0000");
  // Per-row displacement from the row's resting slot, while a drag is in progress.
  const offsets = useRef(new Map<string, Animated.Value>()).current;
  const offsetOf = (key: string) => {
    let value = offsets.get(key);
    if (!value) {
      value = new Animated.Value(0);
      offsets.set(key, value);
    }
    return value;
  };

  const drag = useRef<{ key: string; from: number; target: number } | null>(null);
  const live = useRef({ data, keys, order, rowHeight, reduceMotion, onReorder });
  live.current = { data, keys, order, rowHeight, reduceMotion, onReorder };

  // A new order moves every row's resting slot, so the displacements start again from zero.
  useLayoutEffect(() => {
    offsets.forEach((value) => value.setValue(0));
  }, [order, offsets]);

  const glide = (value: Animated.Value, toValue: number, after?: () => void) => {
    if (live.current.reduceMotion) {
      value.setValue(toValue);
      after?.();
      return;
    }
    Animated.spring(value, {
      toValue,
      stiffness: 420,
      damping: 34,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start(after ? () => after() : undefined);
  };

  const controls = useRef({
    start: (key: string) => {
      const { keys: current } = live.current;
      const from = current.indexOf(key);
      if (from < 0) return;
      offsets.forEach((value) => value.stopAnimation());
      drag.current = { key, from, target: from };
      setDraggingKey(key);
    },
    move: (key: string, dy: number) => {
      const state = drag.current;
      if (!state || state.key !== key) return;
      const { keys: current, rowHeight: height } = live.current;
      const last = current.length - 1;
      const raw = Math.max(0, Math.min(last * height, state.from * height + dy));
      offsetOf(key).setValue(raw - state.from * height);
      const target = Math.max(0, Math.min(last, Math.round(raw / height)));
      if (target === state.target) return;
      state.target = target;
      current.forEach((other, index) => {
        if (index === state.from) return;
        let shift = 0;
        if (state.from < target && index > state.from && index <= target) shift = -height;
        if (state.from > target && index < state.from && index >= target) shift = height;
        glide(offsetOf(other), shift);
      });
    },
    end: (key: string) => {
      const state = drag.current;
      if (!state || state.key !== key) return;
      drag.current = null;
      setDraggingKey(null);
      const { from, target } = state;
      const { rowHeight: height } = live.current;
      glide(offsetOf(key), (target - from) * height, () => {
        const { data: items, order: before, onReorder: commit } = live.current;
        if (target === from) return;
        const next = [...items];
        const [moved] = next.splice(from, 1);
        next.splice(target, 0, moved);
        commit(next);
        // If the parent kept the old order, put the rows back.
        setTimeout(() => {
          if (live.current.order === before) offsets.forEach((value) => glide(value, 0));
        }, 0);
      });
    },
    nudge: (index: number, direction: -1 | 1) => {
      const { data: items, onReorder: commit } = live.current;
      const to = index + direction;
      if (to < 0 || to >= items.length) return;
      const next = [...items];
      const [moved] = next.splice(index, 1);
      next.splice(to, 0, moved);
      commit(next);
    },
  }).current;

  return (
    <View style={[{ height: data.length * rowHeight }, style]}>
      {data.map((item, index) => {
        const key = keys[index];
        return (
          <DragRow
            key={key}
            itemKey={key}
            index={index}
            height={rowHeight}
            offset={offsetOf(key)}
            dragging={draggingKey === key}
            anyDragging={draggingKey !== null}
            reduceMotion={reduceMotion}
            colors={palette}
            controls={controls}
          >
            {renderItem(item, { dragging: draggingKey === key })}
          </DragRow>
        );
      })}
    </View>
  );
}

interface DragRowProps {
  itemKey: string;
  index: number;
  height: number;
  offset: Animated.Value;
  dragging: boolean;
  anyDragging: boolean;
  reduceMotion: boolean;
  colors: DragListColors;
  controls: {
    start: (key: string) => void;
    move: (key: string, dy: number) => void;
    end: (key: string) => void;
    nudge: (index: number, direction: -1 | 1) => void;
  };
  children: ReactNode;
}

function DragRow({
  itemKey,
  index,
  height,
  offset,
  dragging,
  anyDragging,
  reduceMotion,
  colors,
  controls,
  children,
}: DragRowProps) {
  const lift = useRef(new Animated.Value(1)).current;
  const live = useRef({ itemKey, index });
  live.current = { itemKey, index };

  useEffect(() => {
    const toValue = dragging ? 1.03 : 1;
    if (reduceMotion) {
      lift.setValue(toValue);
      return;
    }
    Animated.spring(lift, {
      toValue,
      stiffness: 420,
      damping: 28,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [dragging, reduceMotion, lift]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => controls.start(live.current.itemKey),
      onPanResponderMove: (_, g) => controls.move(live.current.itemKey, g.dy),
      onPanResponderRelease: () => controls.end(live.current.itemKey),
      onPanResponderTerminate: () => controls.end(live.current.itemKey),
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.row,
        {
          top: index * height,
          height,
          backgroundColor: colors.row,
          borderBottomColor: colors.border,
          zIndex: dragging ? 10 : 0,
          transform: [{ translateY: offset }, { scale: lift }],
        },
        dragging && styles.lifted,
      ]}
    >
      <View style={styles.content} pointerEvents={anyDragging ? "none" : "auto"}>
        {children}
      </View>
      <View
        {...pan.panHandlers}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Reorder"
        accessibilityHint="Drag to move this row, or use the move actions"
        accessibilityActions={[
          { name: "moveUp", label: "Move up" },
          { name: "moveDown", label: "Move down" },
        ]}
        onAccessibilityAction={(event) =>
          controls.nudge(live.current.index, event.nativeEvent.actionName === "moveUp" ? -1 : 1)
        }
        style={styles.handle}
      >
        {[0, 1, 2].map((rowIndex) => (
          <View key={rowIndex} style={styles.grip}>
            <View style={[styles.dot, { backgroundColor: colors.handle }]} />
            <View style={[styles.dot, { backgroundColor: colors.handle }]} />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lifted: { boxShadow: "0 10px 24px rgba(0, 0, 0, 0.22)" },
  content: { flex: 1, minWidth: 0 },
  // userSelect keeps a mouse drag on the web from selecting text instead of moving the row.
  handle: {
    width: HANDLE_WIDTH,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    userSelect: "none",
  },
  grip: { flexDirection: "row", gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
