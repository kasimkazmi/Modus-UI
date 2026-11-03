import { useEffect, useMemo, useRef, useState, type ElementRef } from "react";
import {
  AccessibilityInfo,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const LETTER = 18;

export interface ContactItem {
  id: string;
  name: string;
}

export interface ContactIndexColors {
  header: string;
  headerText: string;
  text: string;
  accent: string;
  border: string;
}

const DEFAULT_COLORS: ContactIndexColors = {
  header: "#f3f4f6",
  headerText: "#6b7280",
  text: "#111827",
  accent: "#4f46e5",
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

export interface ContactIndexProps {
  items: ContactItem[];
  onSelect?: (item: ContactItem) => void;
  colors?: Partial<ContactIndexColors>;
  /** Give it a height, for example flex: 1 or a number. */
  style?: StyleProp<ViewStyle>;
}

/**
 * An alphabetical list with a letter rail down the right edge, like a phone's contacts. Names are
 * grouped under letter headers. Tap or drag along the rail to jump to a letter and the list scrolls
 * there; the letter you are on is highlighted and its name is read out.
 */
export function ContactIndex({ items, onSelect, colors, style }: ContactIndexProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const list = useRef<ElementRef<typeof ScrollView>>(null);
  const tops = useRef<Record<string, number>>({});
  const [active, setActive] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, ContactItem[]>();
    [...items]
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((item) => {
        const key = item.name.charAt(0).toUpperCase() || "#";
        map.set(key, [...(map.get(key) ?? []), item]);
      });
    return [...map.entries()];
  }, [items]);

  const live = useRef({ groups, reduceMotion });
  live.current = { groups, reduceMotion };

  const jump = (index: number) => {
    const { groups: all, reduceMotion: reduce } = live.current;
    const key = all[Math.max(0, Math.min(all.length - 1, index))]?.[0];
    if (!key) return;
    setActive(key);
    list.current?.scrollTo({ y: tops.current[key] ?? 0, animated: !reduce });
    AccessibilityInfo.announceForAccessibility(key);
  };

  const rail = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => jump(Math.floor(event.nativeEvent.locationY / LETTER)),
      onPanResponderMove: (event) => jump(Math.floor(event.nativeEvent.locationY / LETTER)),
    }),
  ).current;

  return (
    <View style={[styles.root, style]}>
      <ScrollView ref={list} showsVerticalScrollIndicator={false}>
        {groups.map(([letter, people]) => (
          <View
            key={letter}
            onLayout={(event) => (tops.current[letter] = event.nativeEvent.layout.y)}
          >
            <View style={[styles.header, { backgroundColor: palette.header }]}>
              <Text
                accessibilityRole="header"
                style={[styles.headerText, { color: palette.headerText }]}
              >
                {letter}
              </Text>
            </View>
            {people.map((person) => (
              <Pressable
                key={person.id}
                accessibilityRole="button"
                accessibilityLabel={person.name}
                onPress={() => onSelect?.(person)}
                style={[styles.row, { borderBottomColor: palette.border }]}
              >
                <Text style={[styles.name, { color: palette.text }]}>{person.name}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
      <View
        {...rail.panHandlers}
        accessibilityLabel="Jump to letter"
        accessibilityRole="adjustable"
        style={styles.rail}
      >
        {groups.map(([letter]) => (
          <Text
            key={letter}
            pointerEvents="none"
            style={[
              styles.letter,
              { color: active === letter ? palette.accent : palette.headerText },
            ]}
          >
            {letter}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  header: { paddingHorizontal: 16, paddingVertical: 4 },
  headerText: { fontSize: 13, fontWeight: "700" },
  row: {
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: { fontSize: 16 },
  rail: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    userSelect: "none",
  },
  letter: { height: LETTER, fontSize: 11, fontWeight: "700", lineHeight: LETTER },
});
