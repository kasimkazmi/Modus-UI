import { useEffect, useRef, useState, type ElementRef, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface TabPagerTab {
  id: string;
  label: string;
}

export interface TabPagerColors {
  text: string;
  activeText: string;
  indicator: string;
  border: string;
  background: string;
}

const DEFAULT_COLORS: TabPagerColors = {
  text: "#6b7280",
  activeText: "#111827",
  indicator: "#4f46e5",
  border: "#e5e7eb",
  background: "#ffffff",
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

export interface TabPagerProps {
  tabs: TabPagerTab[];
  /** Renders the content of one page. */
  renderPage: (tab: TabPagerTab, index: number) => ReactNode;
  /** The id of the selected tab. */
  value: string;
  onChange: (id: string) => void;
  colors?: Partial<TabPagerColors>;
  style?: StyleProp<ViewStyle>;
}

interface Box {
  x: number;
  width: number;
}

/**
 * Swipeable pages under a row of tabs. The underline follows your finger between the two tabs it is
 * travelling across, growing or shrinking to each label's width, and the labels blend from muted to
 * active as their page arrives. Tapping a tab scrolls to its page. On desktop browsers the pages can
 * also be dragged with a mouse.
 */
export function TabPager({ tabs, renderPage, value, onChange, colors, style }: TabPagerProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const [boxes, setBoxes] = useState<Box[]>([]);
  // Paging snaps the scroll back on the web, so it is switched off while a mouse drags the pages.
  const [snapping, setSnapping] = useState(true);
  const pages = useRef<ElementRef<typeof ScrollView>>(null);
  const header = useRef<ElementRef<typeof ScrollView>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const current = useRef(
    Math.max(
      0,
      tabs.findIndex((tab) => tab.id === value),
    ),
  );
  // True during a mouse drag and for a moment after it: the click a mouse sends on release is not a tap.
  const dragging = useRef(false);
  const dragStart = useRef(0);
  const headerWidth = useRef(0);

  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === value),
  );
  const last = tabs.length - 1;

  const live = useRef({ width, last, reduceMotion, onChange, tabs, boxes });
  live.current = { width, last, reduceMotion, onChange, tabs, boxes };

  const goTo = (target: number, animated = !live.current.reduceMotion) => {
    const clamped = Math.max(0, Math.min(live.current.last, target));
    pages.current?.scrollTo({ x: clamped * live.current.width, animated });
  };

  // Keep the selected tab's page in view when `value` changes from outside.
  useEffect(() => {
    if (width <= 0 || index === current.current) return;
    current.current = index;
    goTo(index);
    // goTo reads everything through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, width]);

  // Put the first page in place once the width is known.
  useEffect(() => {
    if (width <= 0) return;
    scrollX.setValue(index * width);
    pages.current?.scrollTo({ x: index * width, animated: false });
    // Only the first measurement positions the pages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width > 0]);

  // Slide the header so the selected label stays visible when there are many tabs.
  useEffect(() => {
    const box = boxes[index];
    if (!box || headerWidth.current <= 0) return;
    header.current?.scrollTo({
      x: Math.max(0, box.x - (headerWidth.current - box.width) / 2),
      animated: !reduceMotion,
    });
  }, [index, boxes, reduceMotion]);

  const settle = (x: number) => {
    offset.current = x;
    const next = Math.max(0, Math.min(live.current.last, Math.round(x / live.current.width)));
    if (next !== current.current) {
      current.current = next;
      live.current.onChange(live.current.tabs[next].id);
      AccessibilityInfo.announceForAccessibility(
        `${live.current.tabs[next].label}, tab ${next + 1} of ${live.current.last + 1}`,
      );
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.x;
  };

  // A mouse cannot drag a scroll view, so on desktop browsers the pages are dragged by hand.
  const mouseDrag = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        window.matchMedia("(pointer: fine)").matches &&
        Math.abs(g.dx) > 6 &&
        Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        dragging.current = true;
        dragStart.current = offset.current;
        setSnapping(false);
      },
      onPanResponderMove: (_, g) => {
        pages.current?.scrollTo({ x: dragStart.current - g.dx, animated: false });
      },
      onPanResponderRelease: (_, g) => {
        setTimeout(() => (dragging.current = false), 80);
        setSnapping(true);
        // Carry a flick on to the next page, otherwise settle on the nearest one.
        const target = Math.round((offset.current - g.vx * 160) / live.current.width);
        const clamped = Math.max(0, Math.min(live.current.last, target));
        goTo(clamped);
        settle(clamped * live.current.width);
      },
      onPanResponderTerminate: () => {
        setTimeout(() => (dragging.current = false), 80);
        setSnapping(true);
        goTo(Math.round(offset.current / live.current.width));
      },
    }),
  ).current;

  const ready = width > 0 && boxes.length === tabs.length && tabs.length > 1;
  const inputRange = tabs.map((_, i) => i * width);

  const indicatorX = ready
    ? scrollX.interpolate({
        inputRange,
        outputRange: boxes.map((box) => box.x),
        extrapolate: "clamp",
      })
    : 0;
  const indicatorWidth = ready
    ? scrollX.interpolate({
        inputRange,
        outputRange: boxes.map((box) => box.width),
        extrapolate: "clamp",
      })
    : (boxes[0]?.width ?? 0);

  return (
    <View style={[styles.root, { backgroundColor: palette.background }, style]}>
      <View style={[styles.headerWrap, { borderBottomColor: palette.border }]}>
        <ScrollView
          ref={header}
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={(event: LayoutChangeEvent) => {
            headerWidth.current = event.nativeEvent.layout.width;
          }}
          accessibilityRole="tablist"
          contentContainerStyle={styles.header}
        >
          {tabs.map((tab, i) => {
            const selected = i === index;
            const color = ready
              ? scrollX.interpolate({
                  inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                  outputRange: [palette.text, palette.activeText, palette.text],
                  extrapolate: "clamp",
                })
              : selected
                ? palette.activeText
                : palette.text;
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                aria-selected={selected}
                onLayout={(event: LayoutChangeEvent) => {
                  const { x, width: w } = event.nativeEvent.layout;
                  setBoxes((all) => {
                    const next = [...all];
                    next[i] = { x, width: w };
                    return next;
                  });
                }}
                onPress={() => {
                  if (dragging.current) return;
                  goTo(i);
                  settle(i * live.current.width);
                }}
                style={styles.tab}
              >
                <Animated.Text numberOfLines={1} style={[styles.label, { color }]}>
                  {tab.label}
                </Animated.Text>
              </Pressable>
            );
          })}
          {boxes.length > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicator,
                {
                  backgroundColor: palette.indicator,
                  width: indicatorWidth,
                  transform: [{ translateX: indicatorX }],
                },
              ]}
            />
          ) : null}
        </ScrollView>
      </View>
      <View
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        style={styles.body}
      >
        {width > 0 ? (
          <View {...mouseDrag.panHandlers} style={styles.drag}>
            <Animated.ScrollView
              ref={pages}
              horizontal
              pagingEnabled={snapping}
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                useNativeDriver: false,
                listener: onScroll,
              })}
              onMomentumScrollEnd={(event) => settle(event.nativeEvent.contentOffset.x)}
              onScrollEndDrag={(event) => {
                // Without momentum (a slow drag that stops on a page) the momentum event never fires.
                if (!live.current.reduceMotion) return;
                settle(event.nativeEvent.contentOffset.x);
              }}
            >
              {tabs.map((tab, i) => (
                <View
                  key={tab.id}
                  accessibilityLabel={`${tab.label}, page ${i + 1} of ${tabs.length}`}
                  role="tabpanel"
                  style={{ width }}
                >
                  {renderPage(tab, i)}
                </View>
              ))}
            </Animated.ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  header: { paddingHorizontal: 8, position: "relative" },
  tab: { minHeight: 48, paddingHorizontal: 14, justifyContent: "center", userSelect: "none" },
  label: { fontSize: 15, fontWeight: "600" },
  indicator: { position: "absolute", left: 0, bottom: 0, height: 3, borderRadius: 2 },
  body: { flex: 1 },
  // userSelect keeps a mouse drag on the web from selecting the page's text instead of moving the pages.
  drag: { flex: 1, userSelect: "none" },
});
