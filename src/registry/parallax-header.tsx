import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface ParallaxHeaderColors {
  background: string;
  bar: string;
  title: string;
  border: string;
}

const DEFAULT_COLORS: ParallaxHeaderColors = {
  background: "#ffffff",
  bar: "#ffffff",
  title: "#111827",
  border: "#e5e7eb",
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

export interface ParallaxHeaderProps {
  /** The hero's content. It fills the hero, so give it a background or an image. */
  header: ReactNode;
  /** The scrolling content. */
  children: ReactNode;
  /** Height of the hero before any scrolling. */
  headerHeight?: number;
  /** Height of the bar the hero collapses into. */
  collapsedHeight?: number;
  /** Shown in the collapsed bar. */
  title?: string;
  colors?: Partial<ParallaxHeaderColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A scroll view with a hero that stretches when pulled past the top, drifts at half speed as you
 * scroll, and ends as a compact bar whose title fades in. The content slides over the hero, so give
 * the hero a full-bleed background. With reduced motion the hero scrolls with the content and the
 * bar simply appears once it is covered.
 */
export function ParallaxHeader({
  header,
  children,
  headerHeight = 220,
  collapsedHeight = 56,
  title,
  colors,
  style,
}: ParallaxHeaderProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [viewport, setViewport] = useState(0);

  // Scroll distance over which the hero collapses into the bar.
  const range = Math.max(1, headerHeight - collapsedHeight);

  const heroTranslate = reduceMotion
    ? scrollY.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, -1] })
    : scrollY.interpolate({
        inputRange: [-headerHeight, 0, headerHeight],
        // Pulled down, the hero is pushed half as far as it grows, which keeps its top edge fixed.
        outputRange: [headerHeight / 2, 0, -headerHeight * 0.5],
      });
  const heroScale = reduceMotion
    ? 1
    : scrollY.interpolate({
        inputRange: [-headerHeight, 0],
        outputRange: [2, 1],
        extrapolateRight: "clamp",
      });
  const barOpacity = reduceMotion
    ? scrollY.interpolate({
        inputRange: [range - 1, range],
        outputRange: [0, 1],
        extrapolate: "clamp",
      })
    : scrollY.interpolate({
        inputRange: [range * 0.55, range],
        outputRange: [0, 1],
        extrapolate: "clamp",
      });

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setViewport(event.nativeEvent.layout.height)}
      style={[styles.root, { backgroundColor: palette.background }, style]}
    >
      <Animated.View
        accessibilityElementsHidden={false}
        style={[
          styles.hero,
          {
            height: headerHeight,
            transform: [{ translateY: heroTranslate }, { scale: heroScale }],
          },
        ]}
      >
        {header}
      </Animated.View>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: NATIVE_DRIVER,
        })}
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: headerHeight - 24 }}
      >
        <View
          style={[styles.sheet, { backgroundColor: palette.background, minHeight: viewport + 24 }]}
        >
          {children}
        </View>
      </Animated.ScrollView>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bar,
          {
            height: collapsedHeight,
            backgroundColor: palette.bar,
            borderBottomColor: palette.border,
            opacity: barOpacity,
          },
        ]}
      >
        {title ? (
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={[styles.title, { color: palette.title }]}
          >
            {title}
          </Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  hero: { position: "absolute", top: 0, left: 0, right: 0, overflow: "hidden" },
  scroll: { flex: 1, backgroundColor: "transparent" },
  // The content overlaps the hero's lower edge, so its rounded top corners read as a sheet.
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontWeight: "700" },
});
