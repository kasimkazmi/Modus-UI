import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const PAD = 12;

export interface ExpandCardColors {
  surface: string;
  border: string;
  hero: string;
  title: string;
  subtitle: string;
}

const DEFAULT_COLORS: ExpandCardColors = {
  surface: "#ffffff",
  border: "#e5e7eb",
  hero: "#c7d2fe",
  title: "#111827",
  subtitle: "#6b7280",
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

export interface ExpandCardProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  title: string;
  subtitle?: string;
  /** Drawn inside the picture box, which grows from a thumbnail to a banner. */
  hero?: ReactNode;
  /** The details revealed when the card is open. */
  children?: ReactNode;
  /** Height of the closed card. */
  collapsedHeight?: number;
  /** Height of the open card. */
  expandedHeight?: number;
  /** Height of the picture when the card is open. */
  heroHeight?: number;
  colors?: Partial<ExpandCardColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A card that grows from a compact row into a full detail view. The picture swells from a thumbnail
 * to a banner, the title slides under it, the details fade in, and the chevron turns over, all from
 * one value so the parts stay in step. Pressing the header toggles it; the details stay interactive.
 */
export function ExpandCard({
  expanded,
  onExpandedChange,
  title,
  subtitle,
  hero,
  children,
  collapsedHeight = 88,
  expandedHeight = 340,
  heroHeight = 160,
  colors,
  style,
}: ExpandCardProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const t = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      t.setValue(expanded ? 1 : 0);
      return;
    }
    Animated.timing(t, {
      toValue: expanded ? 1 : 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expanded, reduceMotion, t]);

  const thumb = collapsedHeight - PAD * 2;
  const mix = (from: number, to: number) =>
    t.interpolate({ inputRange: [0, 1], outputRange: [from, to] });
  const headerHeight = heroHeight + 70;
  const detailsTop = headerHeight + 4;

  return (
    <Animated.View
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.card,
        {
          height: mix(collapsedHeight, expandedHeight),
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.hero,
          {
            backgroundColor: palette.hero,
            left: mix(PAD, 0),
            top: mix(PAD, 0),
            width: width > 0 ? mix(thumb, width) : thumb,
            height: mix(thumb, heroHeight),
            borderRadius: mix(12, 0),
          },
        ]}
      >
        {hero}
      </Animated.View>
      <Animated.View
        style={[
          styles.titles,
          { left: mix(thumb + PAD * 2, 20), top: mix(PAD + (thumb - 44) / 2, heroHeight + 14) },
        ]}
        pointerEvents="none"
      >
        <Text numberOfLines={1} style={[styles.title, { color: palette.title }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[styles.subtitle, { color: palette.subtitle }]}>
            {subtitle}
          </Text>
        ) : null}
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.chevron,
          {
            top: mix(collapsedHeight / 2 - 10, heroHeight + 18),
            transform: [
              {
                rotate: mix(0, 180).interpolate({
                  inputRange: [0, 180],
                  outputRange: ["0deg", "180deg"],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={{ fontSize: 18, color: palette.subtitle }}>⌄</Text>
      </Animated.View>
      <Animated.View
        aria-hidden={!expanded}
        pointerEvents={expanded ? "auto" : "none"}
        style={[
          styles.details,
          { top: detailsTop, opacity: t, transform: [{ translateY: mix(14, 0) }] },
        ]}
      >
        {children}
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${expanded ? "collapse" : "expand"}`}
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        onPress={() => onExpandedChange(!expanded)}
        style={[styles.header, { height: expanded ? headerHeight : collapsedHeight }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", borderRadius: 20, borderWidth: 1, userSelect: "none" },
  hero: {
    position: "absolute",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  titles: { position: "absolute", right: 44 },
  title: { fontSize: 17, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
  chevron: { position: "absolute", right: 16 },
  details: { position: "absolute", left: 20, right: 20, bottom: 0 },
  header: { position: "absolute", top: 0, left: 0, right: 0 },
});
