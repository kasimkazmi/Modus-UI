import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const SPARKS = 8;

export interface LikeButtonColors {
  liked: string;
  idle: string;
  count: string;
}

const DEFAULT_COLORS: LikeButtonColors = {
  liked: "#ef4444",
  idle: "#9ca3af",
  count: "#374151",
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

export interface LikeButtonProps {
  liked: boolean;
  onChange: (liked: boolean) => void;
  /** Shows a number beside the heart. */
  count?: number;
  /** Size of the heart. */
  size?: number;
  colors?: Partial<LikeButtonColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A heart button. Liking pops the heart past full size and settles it back while a ring of sparks
 * flies outward and fades; unliking just shrinks it quietly. The button reports whether it is pressed
 * and the count is part of its spoken name. With reduced motion the colour changes and nothing else.
 */
export function LikeButton({ liked, onChange, count, size = 28, colors, style }: LikeButtonProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const pop = useRef(new Animated.Value(1)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) return;
    if (liked) {
      pop.setValue(0.6);
      Animated.spring(pop, {
        toValue: 1,
        stiffness: 300,
        damping: 9,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }).start();
      burst.setValue(0);
      Animated.timing(burst, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: NATIVE_DRIVER,
      }).start();
    } else {
      pop.setValue(0.8);
      Animated.spring(pop, {
        toValue: 1,
        stiffness: 400,
        damping: 20,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }).start();
    }
  }, [liked, reduceMotion, pop, burst]);

  const spark = size * 0.14;
  const reach = size * 0.95;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count === undefined ? "Like" : `Like, ${count} likes`}
      accessibilityState={{ selected: liked }}
      aria-pressed={liked}
      onPress={() => onChange(!liked)}
      hitSlop={8}
      style={[styles.root, style]}
    >
      <View
        style={{
          width: size + 8,
          height: size + 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {Array.from({ length: SPARKS }, (_, i) => {
          const angle = (i / SPARKS) * Math.PI * 2;
          return (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={{
                position: "absolute",
                width: spark,
                height: spark,
                borderRadius: spark / 2,
                backgroundColor: palette.liked,
                opacity: burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
                transform: [
                  {
                    translateX: burst.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.cos(angle) * reach],
                    }),
                  },
                  {
                    translateY: burst.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.sin(angle) * reach],
                    }),
                  },
                  { scale: burst.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
                ],
              }}
            />
          );
        })}
        <Animated.Text
          style={{
            fontSize: size,
            color: liked ? palette.liked : palette.idle,
            transform: [{ scale: pop }],
          }}
        >
          {liked ? "♥" : "♡"}
        </Animated.Text>
      </View>
      {count !== undefined ? (
        <Text style={[styles.count, { color: palette.count }]}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    userSelect: "none",
  },
  count: { fontSize: 15, fontWeight: "700", minWidth: 20 },
});
