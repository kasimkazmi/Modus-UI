import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface FoldPanelItem {
  id: string;
  title: string;
  content: ReactNode;
}

export interface FoldPanelColors {
  surface: string;
  text: string;
  mutedText: string;
  border: string;
}

const DEFAULT_COLORS: FoldPanelColors = {
  surface: "#ffffff",
  text: "#111827",
  mutedText: "#6b7280",
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

export interface FoldPanelProps {
  items: FoldPanelItem[];
  /** Whether several panels can be open at once. When false, opening one closes the others. */
  multiple?: boolean;
  /** Ids of the panels that start open. */
  defaultOpen?: string[];
  colors?: Partial<FoldPanelColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * An accordion whose panels grow to exactly the height of their content, measured rather than
 * guessed, so any content works. The chevron turns as a panel opens, and every header is a button
 * that tells screen readers whether it is expanded. Closed panels are hidden from them.
 */
export function FoldPanel({
  items,
  multiple = false,
  defaultOpen = [],
  colors,
  style,
}: FoldPanelProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [open, setOpen] = useState<string[]>(defaultOpen);

  const toggle = (id: string) =>
    setOpen((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : multiple
          ? [...current, id]
          : [id],
    );

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: palette.surface, borderColor: palette.border },
        style,
      ]}
    >
      {items.map((item, index) => (
        <FoldRow
          key={item.id}
          item={item}
          open={open.includes(item.id)}
          last={index === items.length - 1}
          colors={palette}
          reduceMotion={reduceMotion}
          onToggle={() => toggle(item.id)}
        />
      ))}
    </View>
  );
}

interface FoldRowProps {
  item: FoldPanelItem;
  open: boolean;
  last: boolean;
  colors: FoldPanelColors;
  reduceMotion: boolean;
  onToggle: () => void;
}

function FoldRow({ item, open, last, colors, reduceMotion, onToggle }: FoldRowProps) {
  const [measured, setMeasured] = useState(0);
  // Height can't use the native driver, so it gets its own value; the turn and fade ride the native one.
  const height = useRef(new Animated.Value(0)).current;
  const turn = useRef(new Animated.Value(open ? 1 : 0)).current;
  const placed = useRef(false);

  useEffect(() => {
    const target = open ? measured : 0;
    // The first measurement sets the height outright, so a panel that starts open does not animate in.
    if (!placed.current) {
      if (measured === 0) return;
      placed.current = true;
      height.setValue(target);
      return;
    }
    if (reduceMotion) {
      height.setValue(target);
      return;
    }
    Animated.timing(height, {
      toValue: target,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [open, measured, reduceMotion, height]);

  useEffect(() => {
    if (reduceMotion) {
      turn.setValue(open ? 1 : 0);
      return;
    }
    Animated.spring(turn, {
      toValue: open ? 1 : 0,
      stiffness: 300,
      damping: 26,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [open, reduceMotion, turn]);

  return (
    <View style={!last && { borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Animated.View
          style={[
            styles.chevron,
            {
              borderColor: colors.mutedText,
              transform: [
                {
                  rotate: turn.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["45deg", "225deg"],
                  }),
                },
              ],
            },
          ]}
        />
      </Pressable>
      <Animated.View style={[styles.clip, { height }]}>
        <Animated.View
          accessibilityElementsHidden={!open}
          importantForAccessibility={open ? "auto" : "no-hide-descendants"}
          aria-hidden={!open}
          pointerEvents={open ? "auto" : "none"}
          onLayout={(event: LayoutChangeEvent) => setMeasured(event.nativeEvent.layout.height)}
          style={[styles.body, { opacity: turn }]}
        >
          {item.content}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  pressed: { opacity: 0.7 },
  title: { flex: 1, fontSize: 16, fontWeight: "600" },
  chevron: {
    width: 9,
    height: 9,
    marginBottom: 3,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
  clip: { overflow: "hidden" },
  // Absolute so the body lays out at its natural height, whatever height the clip is animating to.
  body: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
});
