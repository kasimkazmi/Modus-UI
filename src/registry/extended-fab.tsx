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

const SIZE = 56;

export interface ExtendedFabColors {
  background: string;
  text: string;
}

const DEFAULT_COLORS: ExtendedFabColors = {
  background: "#4f46e5",
  text: "#ffffff",
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

export interface ExtendedFabProps {
  label: string;
  onPress: () => void;
  /** A glyph drawn before the label. */
  icon?: string;
  /** Shrinks the button to just its icon, for example while a list is scrolling down. */
  collapsed?: boolean;
  colors?: Partial<ExtendedFabColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A floating action button with a label. While `collapsed` is false it shows icon and label; when it
 * turns true the label slides away and the button shrinks to a circle, the way the compose button
 * folds up as a list scrolls. The label stays in the accessibility tree either way.
 */
export function ExtendedFab({
  label,
  onPress,
  icon = "+",
  collapsed = false,
  colors,
  style,
}: ExtendedFabProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [labelWidth, setLabelWidth] = useState(0);
  const t = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  useEffect(() => {
    const toValue = collapsed ? 0 : 1;
    if (reduceMotion) t.setValue(toValue);
    else
      Animated.timing(t, {
        toValue,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
  }, [collapsed, reduceMotion, t]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.hit, style]}
    >
      <Animated.View
        style={[
          styles.fab,
          {
            backgroundColor: palette.background,
            width: t.interpolate({
              inputRange: [0, 1],
              outputRange: [SIZE, SIZE + labelWidth + 8],
            }),
          },
        ]}
      >
        <Text style={[styles.icon, { color: palette.text }]}>{icon}</Text>
        <Animated.View style={{ opacity: t, width: labelWidth || undefined }}>
          <Text
            numberOfLines={1}
            onLayout={(event: LayoutChangeEvent) =>
              setLabelWidth(Math.ceil(event.nativeEvent.layout.width))
            }
            style={[styles.label, { color: palette.text }]}
          >
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { alignSelf: "flex-start", userSelect: "none" },
  fab: {
    height: SIZE,
    borderRadius: SIZE / 2,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.25)",
  },
  icon: { width: SIZE, textAlign: "center", fontSize: 26, fontWeight: "500" },
  label: { fontSize: 15, fontWeight: "700", marginLeft: -4 },
});
