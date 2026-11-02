import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
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
const PAD = 6;
const TAB_HEIGHT = 52;
const INACTIVE_WIDTH = 56;
const STRETCH = 16;

export interface BubbleTab {
  id: string;
  label: string;
  /** The tab's icon, or a function that receives the tab's current color and returns it. */
  icon: ReactNode | ((color: string) => ReactNode);
}

export interface BubbleTabBarColors {
  bar: string;
  pill: string;
  active: string;
  inactive: string;
}

const DEFAULT_COLORS: BubbleTabBarColors = {
  bar: "#ffffff",
  pill: "#4f46e5",
  active: "#ffffff",
  inactive: "#6b7280",
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

export interface BubbleTabBarProps {
  tabs: BubbleTab[];
  /** The `id` of the selected tab. */
  value: string;
  onChange: (id: string) => void;
  colors?: Partial<BubbleTabBarColors>;
  style?: StyleProp<ViewStyle>;
}

interface TabValues {
  width: Animated.Value;
  label: Animated.Value;
}

/**
 * A bottom tab bar where a rounded pill slides behind the selected tab, stretching a little as it
 * travels. The selected tab opens up to show its label next to the icon; the others stay icon-only.
 * Every tab is at least 44 points tall and wide, and the bar is a tablist to screen readers.
 */
export function BubbleTabBar({ tabs, value, onChange, colors, style }: BubbleTabBarProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [barWidth, setBarWidth] = useState(0);

  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === value),
  );
  const count = tabs.length;
  const inner = Math.max(0, barWidth - PAD * 2);
  const activeWidth = Math.max(INACTIVE_WIDTH, inner - (count - 1) * INACTIVE_WIDTH);

  const pillLeft = useRef(new Animated.Value(PAD)).current;
  const pillWidth = useRef(new Animated.Value(INACTIVE_WIDTH)).current;
  const stretch = useRef(new Animated.Value(0)).current;
  const perTab = useRef(new Map<string, TabValues>()).current;
  // The last layout the animated values were set for; a change of width jumps instead of animating.
  const settled = useRef({ width: 0, index: -1 });

  const valuesFor = (id: string): TabValues => {
    let values = perTab.get(id);
    if (!values) {
      values = { width: new Animated.Value(INACTIVE_WIDTH), label: new Animated.Value(0) };
      perTab.set(id, values);
    }
    return values;
  };

  const ids = tabs.map((tab) => tab.id).join("|");

  useEffect(() => {
    if (barWidth === 0) return;
    const jump = reduceMotion || settled.current.width !== barWidth || settled.current.index === -1;
    settled.current = { width: barWidth, index };

    const leftTarget = PAD + index * INACTIVE_WIDTH;
    const items = ids.split("|").map((id, i) => ({
      values: valuesFor(id),
      width: i === index ? activeWidth : INACTIVE_WIDTH,
      label: i === index ? 1 : 0,
    }));

    if (jump) {
      pillLeft.setValue(leftTarget);
      pillWidth.setValue(activeWidth);
      stretch.setValue(0);
      items.forEach((item) => {
        item.values.width.setValue(item.width);
        item.values.label.setValue(item.label);
      });
      return;
    }

    // Layout properties (left, width) cannot use the native driver.
    const spring = (value: Animated.Value, toValue: number) =>
      Animated.spring(value, {
        toValue,
        stiffness: 320,
        damping: 26,
        mass: 1,
        useNativeDriver: false,
      });
    const animation = Animated.parallel([
      spring(pillLeft, leftTarget),
      spring(pillWidth, activeWidth),
      Animated.sequence([
        Animated.timing(stretch, { toValue: 1, duration: 110, useNativeDriver: false }),
        Animated.spring(stretch, {
          toValue: 0,
          stiffness: 260,
          damping: 18,
          mass: 1,
          useNativeDriver: false,
        }),
      ]),
      ...items.map((item) => spring(item.values.width, item.width)),
      ...items.map((item) =>
        Animated.timing(item.values.label, {
          toValue: item.label,
          duration: 180,
          useNativeDriver: NATIVE_DRIVER,
        }),
      ),
    ]);
    animation.start();
    return () => animation.stop();
    // valuesFor only reads refs, and the animated values are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, barWidth, activeWidth, ids, reduceMotion]);

  const animatedPillWidth = useMemo(
    () =>
      Animated.add(
        pillWidth,
        stretch.interpolate({ inputRange: [0, 1], outputRange: [0, STRETCH] }),
      ),
    [pillWidth, stretch],
  );
  const pillStyle = useMemo(
    () => [
      styles.pill,
      { backgroundColor: palette.pill, left: pillLeft, width: animatedPillWidth },
    ],
    [palette.pill, pillLeft, animatedPillWidth],
  );

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(event: LayoutChangeEvent) => setBarWidth(event.nativeEvent.layout.width)}
      style={[styles.bar, { backgroundColor: palette.bar }, style]}
    >
      <Animated.View pointerEvents="none" style={pillStyle} />
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          selected={tab.id === value}
          values={valuesFor(tab.id)}
          colors={palette}
          onPress={() => onChange(tab.id)}
        />
      ))}
    </View>
  );
}

function TabItem({
  tab,
  selected,
  values,
  colors,
  onPress,
}: {
  tab: BubbleTab;
  selected: boolean;
  values: TabValues;
  colors: BubbleTabBarColors;
  onPress: () => void;
}) {
  const color = selected ? colors.active : colors.inactive;
  const boxStyle = useMemo(() => [styles.tab, { width: values.width }], [values.width]);
  const labelStyle = useMemo(() => [styles.label, { opacity: values.label }], [values.label]);

  return (
    <Animated.View style={boxStyle}>
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected }}
        aria-selected={selected}
        onPress={onPress}
        style={({ pressed }) => [styles.press, pressed && styles.pressed]}
      >
        {typeof tab.icon === "function" ? tab.icon(color) : tab.icon}
        <Animated.Text numberOfLines={1} style={[labelStyle, { color }]}>
          {tab.label}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    padding: PAD,
    borderRadius: (TAB_HEIGHT + PAD * 2) / 2,
    userSelect: "none",
    boxShadow: "0 6px 22px rgba(0, 0, 0, 0.14)",
  },
  pill: {
    position: "absolute",
    top: PAD,
    height: TAB_HEIGHT,
    borderRadius: TAB_HEIGHT / 2,
  },
  tab: { height: TAB_HEIGHT, borderRadius: TAB_HEIGHT / 2, overflow: "hidden" },
  press: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  pressed: { opacity: 0.7 },
  label: { fontSize: 14, fontWeight: "700" },
});
