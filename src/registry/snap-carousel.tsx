import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

// The one method used from the scroll view's instance.
type Scroller = { scrollTo: (options: { x: number; animated?: boolean }) => void };
// How small and faint the cards beside the centered one are drawn.
const SIDE_SCALE = 0.88;
const SIDE_OPACITY = 0.55;
const DOT = 8;
const DOT_ACTIVE = 22;

export interface SnapCarouselColors {
  dot: string;
  activeDot: string;
}

const DEFAULT_COLORS: SnapCarouselColors = {
  dot: "#d1d5db",
  activeDot: "#111827",
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

export interface SnapCarouselProps<T> {
  data: T[];
  /** Renders a card's content. The carousel sizes and animates the card itself. */
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  /** Card width as a fraction of the carousel's width. */
  itemWidth?: number;
  /** Space between cards. */
  gap?: number;
  /** Called when a different card becomes the centered one. */
  onIndexChange?: (index: number) => void;
  /** Index of the card centered at first. */
  initialIndex?: number;
  /** Whether to draw the dots under the cards. */
  showDots?: boolean;
  colors?: Partial<SnapCarouselColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A horizontal carousel that settles on one card at a time. The centered card is full size and
 * opaque, its neighbors shrink and fade with the scroll position, and the dots below stretch to
 * follow. Tap a dot or a neighboring card to go there. The dots row doubles as an adjustable
 * control for screen readers, and on desktop the cards can be dragged with a mouse.
 */
export function SnapCarousel<T>({
  data,
  renderItem,
  keyExtractor,
  itemWidth = 0.72,
  gap = 12,
  onIndexChange,
  initialIndex = 0,
  showDots = true,
  colors,
  style,
}: SnapCarouselProps<T>) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(initialIndex);
  const scroll = useRef<Scroller>(null);
  const x = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const current = useRef(initialIndex);
  // True during a mouse drag and for a moment after it: the click a mouse sends on release is not a tap.
  const dragging = useRef(false);
  const dragStart = useRef(0);

  const card = width * itemWidth;
  const step = card + gap;
  const side = (width - card) / 2;
  const last = data.length - 1;

  const live = useRef({ step, last, reduceMotion, onIndexChange });
  live.current = { step, last, reduceMotion, onIndexChange };

  const goTo = (target: number, animated = !live.current.reduceMotion) => {
    const clamped = Math.max(0, Math.min(live.current.last, target));
    scroll.current?.scrollTo({ x: clamped * live.current.step, animated });
  };

  // Put the initial card in the middle once the width is known.
  useEffect(() => {
    if (step <= 0) return;
    const start = Math.max(0, Math.min(last, initialIndex)) * step;
    x.setValue(start);
    offset.current = start;
    scroll.current?.scrollTo({ x: start, animated: false });
    // Only the first measurement positions the carousel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step > 0]);

  const track = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.max(
      0,
      Math.min(
        live.current.last,
        Math.round(event.nativeEvent.contentOffset.x / live.current.step),
      ),
    );
    offset.current = event.nativeEvent.contentOffset.x;
    if (next !== current.current) {
      current.current = next;
      setIndex(next);
      live.current.onIndexChange?.(next);
      AccessibilityInfo.announceForAccessibility(`Item ${next + 1} of ${live.current.last + 1}`);
    }
  };

  // A mouse cannot drag a scroll view, so on desktop browsers the cards are dragged by hand.
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
      },
      onPanResponderMove: (_, g) => {
        scroll.current?.scrollTo({ x: dragStart.current - g.dx, animated: false });
      },
      onPanResponderRelease: (_, g) => {
        setTimeout(() => (dragging.current = false), 80);
        // Carry a flick on to the next card, otherwise settle on the nearest one.
        const projected = offset.current - g.vx * 160;
        goTo(Math.round(projected / live.current.step));
      },
      onPanResponderTerminate: () => {
        setTimeout(() => (dragging.current = false), 80);
        goTo(Math.round(offset.current / live.current.step));
      },
    }),
  ).current;

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.root, style]}
    >
      {width > 0 ? (
        <View {...mouseDrag.panHandlers} style={styles.drag}>
          <Animated.ScrollView
            ref={scroll as never}
            horizontal
            snapToInterval={step}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], {
              useNativeDriver: NATIVE_DRIVER,
              listener: track,
            })}
            contentContainerStyle={{ paddingHorizontal: side }}
          >
            {data.map((item, i) => {
              const range = [(i - 1) * step, i * step, (i + 1) * step];
              return (
                <Animated.View
                  key={keyExtractor(item, i)}
                  style={{
                    width: card,
                    marginRight: i < last ? gap : 0,
                    opacity: x.interpolate({
                      inputRange: range,
                      outputRange: [SIDE_OPACITY, 1, SIDE_OPACITY],
                      extrapolate: "clamp",
                    }),
                    transform: [
                      {
                        scale: x.interpolate({
                          inputRange: range,
                          outputRange: [SIDE_SCALE, 1, SIDE_SCALE],
                          extrapolate: "clamp",
                        }),
                      },
                    ],
                  }}
                >
                  <Pressable
                    accessible={false}
                    disabled={i === index}
                    onPress={() => {
                      if (!dragging.current) goTo(i);
                    }}
                    style={styles.card}
                  >
                    <View pointerEvents={i === index ? "auto" : "none"} style={styles.card}>
                      {renderItem(item, i)}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.ScrollView>
        </View>
      ) : null}
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Carousel"
        accessibilityValue={{ text: `Item ${index + 1} of ${data.length}` }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) =>
          goTo(index + (event.nativeEvent.actionName === "increment" ? 1 : -1))
        }
        style={showDots ? styles.dots : styles.noDots}
      >
        {showDots
          ? data.map((item, i) => (
              <Dot
                key={keyExtractor(item, i)}
                active={i === index}
                colors={palette}
                reduceMotion={reduceMotion}
                onPress={() => goTo(i)}
              />
            ))
          : null}
      </View>
    </View>
  );
}

function Dot({
  active,
  colors,
  reduceMotion,
  onPress,
}: {
  active: boolean;
  colors: SnapCarouselColors;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  const size = useRef(new Animated.Value(active ? DOT_ACTIVE : DOT)).current;

  useEffect(() => {
    const target = active ? DOT_ACTIVE : DOT;
    if (reduceMotion) {
      size.setValue(target);
      return;
    }
    // Width is not supported by the native driver, so the dots run on the JS thread.
    Animated.spring(size, {
      toValue: target,
      stiffness: 360,
      damping: 24,
      mass: 1,
      useNativeDriver: false,
    }).start();
  }, [active, reduceMotion, size]);

  return (
    <Pressable accessible={false} hitSlop={8} onPress={onPress}>
      <Animated.View
        style={[
          styles.dot,
          { width: size, backgroundColor: active ? colors.activeDot : colors.dot },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%" },
  // userSelect keeps a mouse drag on the web from selecting the cards' text instead of moving them.
  drag: { width: "100%", userSelect: "none" },
  card: { flex: 1 },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 14,
    height: 30,
  },
  noDots: { height: 0 },
  dot: { height: DOT, borderRadius: DOT / 2 },
});
