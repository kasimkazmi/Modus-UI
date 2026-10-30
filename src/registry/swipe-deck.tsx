import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
// Each card behind the top one sits this much smaller and lower.
const DEPTH_SCALE = 0.05;
const DEPTH_LIFT = 12;

type Direction = "left" | "right";

export interface SwipeDeckColors {
  card: string;
  border: string;
  like: string;
  pass: string;
}

const DEFAULT_COLORS: SwipeDeckColors = {
  card: "#ffffff",
  border: "#e5e7eb",
  like: "#16a34a",
  pass: "#dc2626",
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

export interface SwipeDeckProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  /** Called once a card has left the deck. */
  onSwipe?: (item: T, direction: Direction) => void;
  /** Shown when every card has been swiped. */
  empty?: ReactNode;
  /** How many cards are drawn at once, the top one included. */
  visible?: number;
  /** Fraction of the deck's width a drag must cover to send the card away. A fast flick also does. */
  threshold?: number;
  /** Stamp on the card, and screen reader action, for a swipe to the right. */
  rightLabel?: string;
  /** Stamp on the card, and screen reader action, for a swipe to the left. */
  leftLabel?: string;
  colors?: Partial<SwipeDeckColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A stack of cards swiped away one at a time. The top card follows the finger and tilts with it,
 * the card underneath grows to take its place, and release either flies the card off or springs it
 * back. Each swipe is also a screen reader action, so the deck works without the gesture.
 */
export function SwipeDeck<T>({
  data,
  renderCard,
  keyExtractor,
  onSwipe,
  empty,
  visible = 3,
  threshold = 0.3,
  rightLabel = "Like",
  leftLabel = "Pass",
  colors,
  style,
}: SwipeDeckProps<T>) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  // 0 to 1 as the top card is dragged toward leaving; the cards beneath rise with it.
  const progress = useRef(new Animated.Value(0)).current;

  const cards = data.slice(index, index + visible);

  const handleSwiped = (item: T, direction: Direction) => {
    progress.setValue(0);
    setIndex((current) => current + 1);
    onSwipe?.(item, direction);
  };

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.root, style]}
    >
      {cards.length === 0 ? <View style={styles.empty}>{empty}</View> : null}
      {width > 0
        ? cards
            .map((item, depth) => (
              <DeckCard
                key={keyExtractor(item, index + depth)}
                depth={depth}
                width={width}
                threshold={threshold}
                progress={progress}
                reduceMotion={reduceMotion}
                colors={palette}
                rightLabel={rightLabel}
                leftLabel={leftLabel}
                onSwiped={(direction) => handleSwiped(item, direction)}
              >
                {renderCard(item, index + depth)}
              </DeckCard>
            ))
            // The top card is drawn last, so it sits above the rest.
            .reverse()
        : null}
    </View>
  );
}

interface DeckCardProps {
  children: ReactNode;
  depth: number;
  width: number;
  threshold: number;
  progress: Animated.Value;
  reduceMotion: boolean;
  colors: SwipeDeckColors;
  rightLabel: string;
  leftLabel: string;
  onSwiped: (direction: Direction) => void;
}

function DeckCard({
  children,
  depth,
  width,
  threshold,
  progress,
  reduceMotion,
  colors,
  rightLabel,
  leftLabel,
  onSwiped,
}: DeckCardProps) {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const live = useRef({ depth, width, threshold, reduceMotion, onSwiped });
  live.current = { depth, width, threshold, reduceMotion, onSwiped };
  const leaving = useRef(false);

  const fling = (direction: Direction) => {
    if (leaving.current) return;
    leaving.current = true;
    const { width: w, reduceMotion: reduce, onSwiped: done } = live.current;
    const target = (direction === "right" ? 1 : -1) * w * 1.4;
    if (reduce) {
      done(direction);
      return;
    }
    Animated.timing(x, { toValue: target, duration: 220, useNativeDriver: NATIVE_DRIVER }).start(
      () => done(direction),
    );
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => live.current.depth === 0,
      onMoveShouldSetPanResponder: (_, g) =>
        live.current.depth === 0 && Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy) * 0.6,
      onPanResponderGrant: () => {
        x.stopAnimation();
        y.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        x.setValue(g.dx);
        y.setValue(g.dy * 0.4);
        const reach = live.current.width * live.current.threshold;
        progress.setValue(Math.min(1, Math.abs(g.dx) / reach));
      },
      onPanResponderRelease: (_, g) => {
        const { width: w, threshold: t } = live.current;
        const flick = Math.abs(g.vx) > 0.8;
        if (Math.abs(g.dx) > w * t || (flick && g.dx * g.vx > 0)) {
          fling(g.dx > 0 ? "right" : "left");
          return;
        }
        const back = (value: Animated.Value) =>
          Animated.spring(value, {
            toValue: 0,
            stiffness: 360,
            damping: 28,
            mass: 1,
            useNativeDriver: NATIVE_DRIVER,
          });
        progress.setValue(0);
        if (live.current.reduceMotion) {
          x.setValue(0);
          y.setValue(0);
        } else {
          Animated.parallel([back(x), back(y)]).start();
        }
      },
    }),
  ).current;

  const top = depth === 0;
  const rotate = reduceMotion
    ? "0deg"
    : x.interpolate({ inputRange: [-width, 0, width], outputRange: ["-14deg", "0deg", "14deg"] });
  const scale = top
    ? 1
    : progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1 - depth * DEPTH_SCALE, 1 - (depth - 1) * DEPTH_SCALE],
      });
  const lift = top
    ? 0
    : progress.interpolate({
        inputRange: [0, 1],
        outputRange: [depth * DEPTH_LIFT, (depth - 1) * DEPTH_LIFT],
      });
  const likeOpacity = x.interpolate({
    inputRange: [0, width * 0.3],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const passOpacity = x.interpolate({
    inputRange: [-width * 0.3, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      {...(top ? pan.panHandlers : {})}
      accessible={top}
      accessibilityActions={
        top
          ? [
              { name: "swipeRight", label: rightLabel },
              { name: "swipeLeft", label: leftLabel },
            ]
          : undefined
      }
      onAccessibilityAction={(event) =>
        fling(event.nativeEvent.actionName === "swipeRight" ? "right" : "left")
      }
      pointerEvents={top ? "auto" : "none"}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [
            { translateX: x },
            { translateY: Animated.add(y, lift) },
            { rotate },
            { scale },
          ],
        },
      ]}
    >
      {children}
      {top ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.stamp,
              styles.stampLeft,
              { borderColor: colors.like, opacity: likeOpacity },
            ]}
          >
            <Text style={[styles.stampText, { color: colors.like }]}>{rightLabel}</Text>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.stamp,
              styles.stampRight,
              { borderColor: colors.pass, opacity: passOpacity },
            ]}
          >
            <Text style={[styles.stampText, { color: colors.pass }]}>{leftLabel}</Text>
          </Animated.View>
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // userSelect keeps a mouse drag on the web from selecting the card's text instead of moving it.
  card: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    userSelect: "none",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.14)",
  },
  empty: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  stamp: {
    position: "absolute",
    top: 24,
    borderWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stampLeft: { left: 20, transform: [{ rotate: "-12deg" }] },
  stampRight: { right: 20, transform: [{ rotate: "12deg" }] },
  stampText: { fontSize: 22, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
});
