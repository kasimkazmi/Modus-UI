import { useEffect, useRef, useState } from "react";
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

export interface ExpandableTextColors {
  text: string;
  link: string;
}

const DEFAULT_COLORS: ExpandableTextColors = {
  text: "#374151",
  link: "#4f46e5",
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

export interface ExpandableTextProps {
  text: string;
  /** How many lines show before it is cut off. */
  lines?: number;
  /** Height of one line. */
  lineHeight?: number;
  moreLabel?: string;
  lessLabel?: string;
  colors?: Partial<ExpandableTextColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A paragraph that shows a few lines and a Read more link. Pressing the link grows the box to the
 * full text, and it shrinks back on Show less; the link only appears when the text is long enough to
 * be cut. The link reports whether it is expanded.
 */
export function ExpandableText({
  text,
  lines = 3,
  lineHeight = 22,
  moreLabel = "Read more",
  lessLabel = "Show less",
  colors,
  style,
}: ExpandableTextProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [expanded, setExpanded] = useState(false);
  const [full, setFull] = useState(0);
  const collapsed = lines * lineHeight;
  const height = useRef(new Animated.Value(collapsed)).current;
  const long = full > collapsed + 1;

  useEffect(() => {
    if (full === 0) return;
    const toValue = expanded && long ? full : collapsed;
    if (reduceMotion) height.setValue(toValue);
    else
      Animated.timing(height, {
        toValue,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
  }, [expanded, full, long, collapsed, reduceMotion, height]);

  return (
    <View style={style}>
      <Animated.View style={{ height: long ? height : undefined, overflow: "hidden" }}>
        <Text
          onLayout={(event: LayoutChangeEvent) => setFull(event.nativeEvent.layout.height)}
          style={[styles.text, { color: palette.text, lineHeight }]}
        >
          {text}
        </Text>
      </Animated.View>
      {long ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? lessLabel : moreLabel}
          accessibilityState={{ expanded }}
          aria-expanded={expanded}
          onPress={() => setExpanded(!expanded)}
          hitSlop={8}
          style={styles.link}
        >
          <Text style={[styles.linkText, { color: palette.link }]}>
            {expanded ? lessLabel : moreLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 15 },
  link: { alignSelf: "flex-start", minHeight: 40, justifyContent: "center", userSelect: "none" },
  linkText: { fontSize: 15, fontWeight: "700" },
});
