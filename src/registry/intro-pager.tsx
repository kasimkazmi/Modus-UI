import { useEffect, useMemo, useRef, useState, type ElementRef, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const BUTTON_MIN = 120;
const BUTTON_MAX = 184;
const IS_WEB = Platform.OS === "web";

export interface IntroPage {
  id: string;
  title: string;
  description: string;
  /** The picture above the text. It is centered in its area and drifts against the text as you swipe. */
  art: ReactNode;
}

export interface IntroPagerColors {
  background: string;
  title: string;
  text: string;
  dot: string;
  activeDot: string;
  button: string;
  buttonText: string;
}

const DEFAULT_COLORS: IntroPagerColors = {
  background: "#ffffff",
  title: "#111827",
  text: "#6b7280",
  dot: "#d1d5db",
  activeDot: "#4f46e5",
  button: "#4f46e5",
  buttonText: "#ffffff",
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

export interface IntroPagerProps {
  pages: IntroPage[];
  /** Called when the button is pressed on the last page. */
  onDone: () => void;
  /** Label of the skip button, shown until the last page. */
  skipLabel?: string;
  /** Label of the button until the last page. */
  nextLabel?: string;
  /** Label the button morphs into on the last page. */
  doneLabel?: string;
  colors?: Partial<IntroPagerColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A swipeable onboarding pager. The art drifts against the text as you swipe, the dots stretch to
 * show where you are, and the button turns from Next into the final action on the last page. On
 * the web it also pages with a mouse drag, which a scroll view does not do by itself. The pager
 * fills its parent, so give the parent a height.
 */
export function IntroPager({
  pages,
  onDone,
  skipLabel = "Skip",
  nextLabel = "Next",
  doneLabel = "Get started",
  colors,
  style,
}: IntroPagerProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const scroll = useRef<ElementRef<typeof ScrollView>>(null);
  // Width drives the dots, so the scroll position uses the JS driver on every platform.
  const scrollX = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const live = useRef({ width, index, count: pages.length });
  live.current = { width, index, count: pages.length };

  const count = pages.length;
  const last = index >= count - 1;

  const goTo = (page: number, animated = true) => {
    const target = Math.max(0, Math.min(count - 1, page));
    scroll.current?.scrollTo({ x: target * width, animated: animated && !reduceMotion });
  };

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
    listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = event.nativeEvent.contentOffset.x;
      const { width: w, index: current } = live.current;
      const page = w > 0 ? Math.round(offset.current / w) : 0;
      if (page !== current) setIndex(page);
    },
  });

  // Mouse drag for the web: browsers scroll a div with touch and wheel but not with a mouse drag.
  const mouse = useRef(false);
  const dragStart = useRef(0);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        IS_WEB && mouse.current && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        dragStart.current = offset.current;
        setDragging(true);
      },
      onPanResponderMove: (_, g) => {
        scroll.current?.scrollTo({ x: dragStart.current - g.dx, animated: false });
      },
      onPanResponderRelease: (_, g) => {
        const { width: w, count: total } = live.current;
        const start = Math.round(dragStart.current / w);
        const flick = Math.abs(g.vx) > 0.4;
        const forward = g.dx < -w * 0.2 || (flick && g.vx < 0);
        const back = g.dx > w * 0.2 || (flick && g.vx > 0);
        const target = Math.max(0, Math.min(total - 1, start + (forward ? 1 : back ? -1 : 0)));
        setDragging(false);
        scroll.current?.scrollTo({ x: target * w, animated: true });
      },
      onPanResponderTerminate: () => setDragging(false),
    }),
  ).current;

  // Built once per width so react-native-web does not restart animations on every page change.
  const motion = useMemo(() => {
    const pageRange = (i: number) => [(i - 1) * width, i * width, (i + 1) * width];
    const still = (value: number) => ({ inputRange: [0, 1], outputRange: [value, value] });
    return {
      art: pages.map((_, i) =>
        width === 0 || reduceMotion
          ? scrollX.interpolate(still(0))
          : scrollX.interpolate({
              inputRange: pageRange(i),
              outputRange: [width * 0.35, 0, -width * 0.35],
            }),
      ),
      fade: pages.map((_, i) =>
        width === 0 || reduceMotion
          ? scrollX.interpolate(still(1))
          : scrollX.interpolate({
              inputRange: pageRange(i),
              outputRange: [0, 1, 0],
              extrapolate: "clamp",
            }),
      ),
      dotWidth: pages.map((_, i) =>
        width === 0
          ? scrollX.interpolate(still(8))
          : scrollX.interpolate({
              inputRange: pageRange(i),
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            }),
      ),
      dotFill: pages.map((_, i) =>
        width === 0
          ? scrollX.interpolate(still(0))
          : scrollX.interpolate({
              inputRange: pageRange(i),
              outputRange: [0, 1, 0],
              extrapolate: "clamp",
            }),
      ),
      toDone: scrollX.interpolate({
        inputRange: [Math.max(0, (count - 2) * width), Math.max(1, (count - 1) * width)],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
    };
  }, [scrollX, width, count, pages, reduceMotion]);

  const buttonWidth = motion.toDone.interpolate({
    inputRange: [0, 1],
    outputRange: [BUTTON_MIN, BUTTON_MAX],
  });
  const nextOpacity = motion.toDone.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const skipOpacity = motion.toDone.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.root, { backgroundColor: palette.background }, style]}
    >
      {width > 0 ? (
        <View
          style={styles.pages}
          onPointerDown={(event) => {
            mouse.current = event.nativeEvent.pointerType === "mouse";
          }}
          {...pan.panHandlers}
        >
          <Animated.ScrollView
            ref={scroll}
            horizontal
            pagingEnabled={!dragging}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onScroll}
            style={styles.scroll}
            contentContainerStyle={styles.track}
          >
            {pages.map((page, i) => (
              <View
                key={page.id}
                role="group"
                accessibilityLabel={`Page ${i + 1} of ${count}`}
                style={[styles.page, { width }]}
              >
                <Animated.View style={[styles.art, { transform: [{ translateX: motion.art[i] }] }]}>
                  {page.art}
                </Animated.View>
                <Animated.View style={[styles.copy, { opacity: motion.fade[i] }]}>
                  <Text accessibilityRole="header" style={[styles.title, { color: palette.title }]}>
                    {page.title}
                  </Text>
                  <Text style={[styles.description, { color: palette.text }]}>
                    {page.description}
                  </Text>
                </Animated.View>
              </View>
            ))}
          </Animated.ScrollView>
        </View>
      ) : null}
      <Animated.View
        pointerEvents={last ? "none" : "auto"}
        style={[styles.skip, { opacity: skipOpacity }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={skipLabel}
          hitSlop={8}
          onPress={() => goTo(count - 1)}
        >
          <Text style={[styles.skipText, { color: palette.text }]}>{skipLabel}</Text>
        </Pressable>
      </Animated.View>
      <View style={styles.footer}>
        <View accessible={false} style={styles.dots}>
          {pages.map((page, i) => (
            <Animated.View
              key={page.id}
              style={[styles.dot, { width: motion.dotWidth[i], backgroundColor: palette.dot }]}
            >
              <Animated.View
                style={[
                  styles.dotFill,
                  { backgroundColor: palette.activeDot, opacity: motion.dotFill[i] },
                ]}
              />
            </Animated.View>
          ))}
        </View>
        <Animated.View style={{ width: buttonWidth }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={last ? doneLabel : nextLabel}
            onPress={() => (last ? onDone() : goTo(index + 1))}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: palette.button },
              pressed && styles.pressed,
            ]}
          >
            <Animated.Text
              style={[styles.label, { color: palette.buttonText, opacity: nextOpacity }]}
            >
              {nextLabel}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.label,
                styles.labelDone,
                { color: palette.buttonText, opacity: motion.toDone },
              ]}
            >
              {doneLabel}
            </Animated.Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  pages: { flex: 1, userSelect: "none" },
  scroll: { flex: 1 },
  track: { flexGrow: 1 },
  page: { paddingHorizontal: 32, paddingTop: 56 },
  art: { flex: 1, alignItems: "center", justifyContent: "center" },
  copy: { paddingTop: 24, paddingBottom: 16, gap: 10 },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  description: { fontSize: 16, lineHeight: 23, textAlign: "center" },
  skip: { position: "absolute", top: 18, right: 22 },
  skipText: { fontSize: 15, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 8, borderRadius: 4, overflow: "hidden" },
  dotFill: { flex: 1 },
  button: { height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.85 },
  label: { fontSize: 16, fontWeight: "700" },
  labelDone: { position: "absolute" },
});
