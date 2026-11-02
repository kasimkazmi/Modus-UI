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

export interface Reaction {
  id: string;
  emoji: string;
  /** Spoken name, for example "Love". */
  label: string;
}

export interface ReactionBarColors {
  pill: string;
  selectedPill: string;
  border: string;
  selectedBorder: string;
  text: string;
  count: string;
}

const DEFAULT_COLORS: ReactionBarColors = {
  pill: "#f3f4f6",
  selectedPill: "#e0e7ff",
  border: "transparent",
  selectedBorder: "#4f46e5",
  text: "#111827",
  count: "#4b5563",
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

export interface ReactionBarProps {
  reactions: Reaction[];
  /** How many other people chose each reaction, by id. Your own choice is added on top. */
  counts: Record<string, number>;
  /** The reaction you chose, or null. */
  value: string | null;
  /** Called with the reaction you chose, or null when you take yours back. */
  onChange: (next: string | null) => void;
  /** Hides the count on reactions nobody chose. */
  hideZero?: boolean;
  colors?: Partial<ReactionBarColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A row of emoji reactions. Choosing one pops and wobbles its emoji, tints the pill and rolls the
 * count to its new number; pressing your choice again takes it back. You can hold one reaction at a
 * time. Each pill reads out as "Love, 9, selected" and mirrors its state for screen readers.
 */
export function ReactionBar({
  reactions,
  counts,
  value,
  onChange,
  hideZero = true,
  colors,
  style,
}: ReactionBarProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  return (
    <View accessibilityRole="toolbar" style={[styles.row, style]}>
      {reactions.map((reaction) => {
        const mine = value === reaction.id;
        return (
          <Pill
            key={reaction.id}
            reaction={reaction}
            count={(counts[reaction.id] ?? 0) + (mine ? 1 : 0)}
            selected={mine}
            hideZero={hideZero}
            palette={palette}
            onPress={() => onChange(mine ? null : reaction.id)}
          />
        );
      })}
    </View>
  );
}

interface PillProps {
  reaction: Reaction;
  count: number;
  selected: boolean;
  hideZero: boolean;
  palette: ReactionBarColors;
  onPress: () => void;
}

function Pill({ reaction, count, selected, hideZero, palette, onPress }: PillProps) {
  const reduceMotion = useReduceMotion();
  const tint = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const roll = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const previous = useRef({ count, selected });

  useEffect(() => {
    const was = previous.current;
    previous.current = { count, selected };
    if (reduceMotion) {
      tint.setValue(selected ? 1 : 0);
      return;
    }
    Animated.timing(tint, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
    if (selected && !was.selected) {
      pop.setValue(0);
      Animated.timing(pop, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }).start();
    }
    if (count !== was.count) {
      // The new number slides in from the direction it moved.
      roll.setValue(count > was.count ? 1 : -1);
      Animated.timing(roll, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: NATIVE_DRIVER,
      }).start();
    }
  }, [count, selected, reduceMotion, tint, pop, roll]);

  const dip = (down: boolean) => {
    if (reduceMotion) return;
    Animated.spring(press, {
      toValue: down ? 0.94 : 1,
      stiffness: 500,
      damping: 24,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  const showCount = !(hideZero && count === 0);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${reaction.label}, ${count}${selected ? ", selected" : ""}`}
      accessibilityState={{ selected }}
      aria-pressed={selected}
      aria-selected={selected}
      hitSlop={4}
      onPress={onPress}
      onPressIn={() => dip(true)}
      onPressOut={() => dip(false)}
    >
      <Animated.View
        style={[
          styles.pill,
          {
            backgroundColor: tint.interpolate({
              inputRange: [0, 1],
              outputRange: [palette.pill, palette.selectedPill],
            }),
            borderColor: tint.interpolate({
              inputRange: [0, 1],
              outputRange: [palette.border, palette.selectedBorder],
            }),
            transform: [{ scale: press }],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.emoji,
            {
              transform: [
                { scale: pop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.55, 1] }) },
                {
                  rotate: pop.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: ["0deg", "-16deg", "12deg", "-6deg", "0deg"],
                  }),
                },
              ],
            },
          ]}
        >
          {reaction.emoji}
        </Animated.Text>
        {showCount ? (
          <View style={styles.countClip}>
            <Animated.Text
              style={[
                styles.count,
                {
                  color: selected ? palette.text : palette.count,
                  opacity: roll.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
                  transform: [
                    {
                      translateY: roll.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] }),
                    },
                  ],
                },
              ]}
            >
              {count}
            </Animated.Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    userSelect: "none",
  },
  emoji: { fontSize: 18 },
  countClip: { overflow: "hidden", minWidth: 10 },
  count: { fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] },
});
