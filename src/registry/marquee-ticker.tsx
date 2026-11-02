import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface MarqueeTickerColors {
  background: string;
}

const DEFAULT_COLORS: MarqueeTickerColors = {
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

export interface MarqueeTickerProps {
  /** The content that scrolls. It repeats as many times as it takes to fill the strip. */
  children: ReactNode;
  /** Scroll speed in pixels per second. */
  speed?: number;
  /** Which way the content travels. */
  direction?: "left" | "right";
  /** Space between one repeat of the content and the next. */
  gap?: number;
  /** Pause while the strip is pressed and held. */
  pauseOnPress?: boolean;
  colors?: Partial<MarqueeTickerColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * An endless strip of scrolling content. The content is measured and repeated to fill the strip
 * plus one spare copy; the strip then travels exactly one copy per loop, so the seam is
 * invisible. Press and hold to pause. With reduced motion the content stands still, left aligned
 * and clipped. Screen readers read the first copy only.
 */
export function MarqueeTicker({
  children,
  speed = 60,
  direction = "left",
  gap = 32,
  pauseOnPress = true,
  colors,
  style,
}: MarqueeTickerProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [containerWidth, setContainerWidth] = useState(0);
  // Width of one repeat of the content, its trailing gap included.
  const [unit, setUnit] = useState(0);
  // 0 to 1 is one full copy of travel.
  const progress = useRef(new Animated.Value(0)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const held = useRef(false);

  const total = unit > 0 ? (unit / Math.max(1, speed)) * 1000 : 0;

  const startFrom = (from: number) => {
    running.current?.stop();
    if (unit === 0) return;
    const loop = () => {
      progress.setValue(0);
      running.current = Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: total,
          easing: Easing.linear,
          useNativeDriver: NATIVE_DRIVER,
        }),
      );
      running.current.start();
    };
    if (from <= 0) {
      loop();
      return;
    }
    // Finish the copy that was interrupted, then settle into the regular loop.
    progress.setValue(from);
    running.current = Animated.timing(progress, {
      toValue: 1,
      duration: total * (1 - from),
      easing: Easing.linear,
      useNativeDriver: NATIVE_DRIVER,
    });
    running.current.start(({ finished }) => {
      if (finished) loop();
    });
  };

  useEffect(() => {
    if (reduceMotion || unit === 0) {
      progress.setValue(direction === "left" ? 0 : 1);
      return;
    }
    startFrom(0);
    return () => running.current?.stop();
    // startFrom reads everything it needs from this render's unit, total and progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, unit, speed, direction]);

  // Built once per width and direction: rebuilding it each render drops the running animation
  // on react-native-web.
  const translateX = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: direction === "left" ? [0, -unit] : [-unit, 0],
      }),
    [progress, unit, direction],
  );

  const copies = unit > 0 && containerWidth > 0 ? Math.ceil(containerWidth / unit) + 1 : 2;

  const pause = () => {
    if (!pauseOnPress || reduceMotion || unit === 0) return;
    held.current = true;
    running.current?.stop();
    progress.stopAnimation((value) => {
      // Released before the value came back: carry straight on.
      if (!held.current) startFrom(value >= 1 ? 0 : value);
    });
  };

  const resume = () => {
    if (!held.current) return;
    held.current = false;
    progress.stopAnimation((value) => startFrom(value >= 1 ? 0 : value));
  };

  return (
    <Pressable
      accessible={false}
      disabled={!pauseOnPress || reduceMotion}
      onPressIn={pause}
      onPressOut={resume}
      onLayout={(event: LayoutChangeEvent) => setContainerWidth(event.nativeEvent.layout.width)}
      style={[styles.root, { backgroundColor: palette.background }, style]}
    >
      <Animated.View
        style={[
          styles.track,
          unit > 0 && { width: unit * copies },
          { transform: [{ translateX }] },
        ]}
      >
        {Array.from({ length: copies }, (_, i) => (
          <View
            key={`copy-${i}`}
            onLayout={
              i === 0
                ? (event: LayoutChangeEvent) => {
                    const next = Math.round(event.nativeEvent.layout.width * 100) / 100;
                    setUnit((current) => (Math.abs(current - next) > 0.5 ? next : current));
                  }
                : undefined
            }
            {...(i > 0
              ? {
                  accessibilityElementsHidden: true,
                  importantForAccessibility: "no-hide-descendants" as const,
                  "aria-hidden": true,
                }
              : {})}
            style={[styles.copy, { paddingRight: gap }]}
          >
            {children}
          </View>
        ))}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // userSelect keeps a mouse press on the web from selecting the text instead of pausing.
  root: { overflow: "hidden", userSelect: "none" },
  track: { flexDirection: "row", alignSelf: "flex-start" },
  copy: { flexDirection: "row", alignItems: "center", flexShrink: 0 },
});
