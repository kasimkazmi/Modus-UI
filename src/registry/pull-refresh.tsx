import { useEffect, useRef, useState, type ElementRef, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const INDICATOR = 40;

export interface PullRefreshColors {
  indicator: string;
  arrow: string;
  background: string;
}

const DEFAULT_COLORS: PullRefreshColors = {
  indicator: "#4f46e5",
  arrow: "#6b7280",
  background: "transparent",
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

export interface PullRefreshProps {
  /** Whether a refresh is under way. Set it true in `onRefresh` and false when the work is done. */
  refreshing: boolean;
  /** Called when the list is pulled past the threshold and let go. */
  onRefresh: () => void;
  /** The scrolling content. */
  children: ReactNode;
  /** How far, in pixels, the content must be pulled to trigger a refresh. */
  threshold?: number;
  colors?: Partial<PullRefreshColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A scrolling list you refresh by pulling it down from the top. The content follows your finger
 * with growing resistance, an arrow turns over as you reach the threshold, and on release a spinner
 * holds the content open until you set `refreshing` back to false. It works with a mouse drag on the
 * web, and screen readers get a Refresh action instead.
 */
export function PullRefresh({
  refreshing,
  onRefresh,
  children,
  threshold = 72,
  colors,
  style,
}: PullRefreshProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const pull = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const atTop = useRef(true);
  const dragging = useRef(false);
  const hold = INDICATOR + 12;

  const live = useRef({ refreshing, onRefresh, threshold, reduceMotion });
  live.current = { refreshing, onRefresh, threshold, reduceMotion };

  const settleTo = (toValue: number) => {
    if (live.current.reduceMotion) {
      pull.setValue(toValue);
      return;
    }
    Animated.spring(pull, {
      toValue,
      stiffness: 300,
      damping: 28,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  // Hold the content open while refreshing, and close it when the work is done.
  useEffect(() => {
    if (dragging.current) return;
    settleTo(refreshing ? hold : 0);
    // settleTo reads everything through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing, reduceMotion]);

  useEffect(() => {
    if (!refreshing || reduceMotion) {
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [refreshing, reduceMotion, spin]);

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        atTop.current && !live.current.refreshing && g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        dragging.current = true;
        pull.stopAnimation();
      },
      // Growing resistance: the content moves less and less the further it is pulled.
      onPanResponderMove: (_, g) => {
        const limit = live.current.threshold * 1.8;
        pull.setValue(limit * (1 - Math.exp(-Math.max(0, g.dy) / (limit * 1.2))));
      },
      onPanResponderRelease: () => {
        dragging.current = false;
        pull.stopAnimation((value) => {
          if (value >= live.current.threshold * 0.8) {
            live.current.onRefresh();
            settleTo(hold);
          } else {
            settleTo(0);
          }
        });
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        settleTo(live.current.refreshing ? hold : 0);
      },
    }),
  ).current;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    atTop.current = event.nativeEvent.contentOffset.y <= 0;
  };

  const progress = pull.interpolate({
    inputRange: [0, threshold * 0.8],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const scroller = useRef<ElementRef<typeof ScrollView>>(null);

  return (
    <View
      accessibilityActions={[{ name: "refresh", label: "Refresh" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "refresh" && !refreshing) onRefresh();
      }}
      style={[styles.root, { backgroundColor: palette.background }, style]}
    >
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        style={[
          styles.indicator,
          {
            opacity: progress,
            transform: [
              {
                translateY: pull.interpolate({
                  inputRange: [0, hold],
                  outputRange: [-INDICATOR, 6],
                  extrapolate: "extend",
                }),
              },
              { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            ],
          },
        ]}
      >
        {refreshing ? (
          <Animated.View
            style={[
              styles.spinner,
              {
                borderTopColor: palette.indicator,
                transform: [
                  {
                    rotate: spin.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              },
            ]}
          />
        ) : (
          <Animated.Text
            style={[
              styles.arrow,
              {
                color: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [palette.arrow, palette.indicator],
                }),
                transform: [
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 0.9, 1],
                      outputRange: ["0deg", "0deg", "180deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            ↓
          </Animated.Text>
        )}
      </Animated.View>
      <Animated.View
        {...responder.panHandlers}
        style={[styles.content, { transform: [{ translateY: pull }] }]}
      >
        <ScrollView ref={scroller} bounces={false} scrollEventThrottle={16} onScroll={onScroll}>
          {children}
        </ScrollView>
      </Animated.View>
      {refreshing ? (
        <Text accessibilityLiveRegion="polite" style={styles.sr}>
          Refreshing
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden", userSelect: "none" },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: INDICATOR,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: "rgba(128,128,128,0.25)",
  },
  arrow: { fontSize: 22, fontWeight: "800" },
  content: { flex: 1 },
  sr: { position: "absolute", width: 1, height: 1, opacity: 0 },
});
