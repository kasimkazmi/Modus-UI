import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

// How far apart avatars sit when the stack is spread, in place of the overlap.
const SPREAD_GAP = 8;
const RING = 2;
// Initials avatars take a stable color from this list, chosen by the person's name.
const PALETTE = [
  "#6366f1",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
];

export interface AvatarPerson {
  id: string;
  name: string;
  /** A photo URL. Without one the avatar shows the person's initials. */
  image?: string;
}

export interface AvatarStackColors {
  /** The ring around each avatar, normally the surface color, so overlaps read as separate. */
  ring: string;
  /** Initials. */
  text: string;
  /** Background of the "+N" avatar. */
  plus: string;
}

const DEFAULT_COLORS: AvatarStackColors = {
  ring: "#ffffff",
  text: "#ffffff",
  plus: "#6b7280",
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

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const colorFor = (name: string) => {
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return PALETTE[sum % PALETTE.length];
};

/** "Maya Chen, Leo Park and 3 others": the first two names, then a count. */
function describe(people: AvatarPerson[]) {
  const [first, second] = people;
  if (!first) return "No people";
  if (!second) return first.name;
  const rest = people.length - 2;
  if (rest === 0) return `${first.name} and ${second.name}`;
  return `${first.name}, ${second.name} and ${rest} ${rest === 1 ? "other" : "others"}`;
}

export interface AvatarStackProps {
  people: AvatarPerson[];
  /** How many avatars show before the rest collapse into a "+N" avatar. */
  max?: number;
  /** Diameter of each avatar. */
  size?: number;
  /** How far each avatar covers the one before it, in pixels. */
  overlap?: number;
  /** Pressing the stack spreads the avatars apart and reveals the ones past `max`. */
  expandOnPress?: boolean;
  /** Called with the person whose avatar is pressed, once the stack is spread (or if it can't spread). */
  onPersonPress?: (person: AvatarPerson) => void;
  colors?: Partial<AvatarStackColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * Overlapping avatars with a "+N" for the rest. Press the stack and the avatars spring apart one after
 * another, showing everyone; press again, or anywhere outside, and they fold back. The group reads out
 * as "Maya Chen, Leo Park and 3 others", and with reduced motion it spreads without animating.
 */
export function AvatarStack({
  people,
  max = 4,
  size = 40,
  overlap = 12,
  expandOnPress = true,
  onPersonPress,
  colors,
  style,
}: AvatarStackProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  // `open` is the target; `showAll` stays true while the avatars fold back, then drops the extras.
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  // One 0 to 1 value per avatar, so they can spread one after another.
  const spreads = useRef(new Map<string, Animated.Value>());

  const hidden = Math.max(0, people.length - max);
  const shown = showAll ? people : people.slice(0, max);
  const showPlus = hidden > 0 && !showAll;

  const spreadFor = (key: string) => {
    let value = spreads.current.get(key);
    if (!value) {
      value = new Animated.Value(0);
      spreads.current.set(key, value);
    }
    return value;
  };

  useEffect(() => {
    const values = [...spreads.current.values()];
    const target = open ? 1 : 0;
    if (reduceMotion) {
      values.forEach((value) => value.setValue(target));
      if (!open) setShowAll(false);
      return;
    }
    // marginLeft is a layout property, so these springs cannot use the native driver.
    Animated.stagger(
      45,
      values.map((value) =>
        Animated.spring(value, {
          toValue: target,
          stiffness: 260,
          damping: 18,
          mass: 1,
          useNativeDriver: false,
        }),
      ),
    ).start(({ finished }) => {
      if (finished && !open) setShowAll(false);
    });
  }, [open, showAll, reduceMotion]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setShowAll(true);
    setOpen(true);
  };

  const pressPerson = (person: AvatarPerson) => {
    // A press first spreads a folded stack; once it is spread (or if it cannot spread) it picks the person.
    if (expandOnPress && !open) {
      toggle();
      return;
    }
    if (onPersonPress) onPersonPress(person);
    else if (expandOnPress) toggle();
  };

  const interactive = expandOnPress || !!onPersonPress;
  const hitSlop = Math.max(0, Math.ceil((44 - size) / 2));

  const avatarStyle = (key: string, index: number, extra: boolean) => {
    const spread = spreadFor(key);
    return {
      marginLeft:
        index === 0
          ? 0
          : spread.interpolate({ inputRange: [0, 1], outputRange: [-overlap, SPREAD_GAP] }),
      // Avatars past `max` fade and grow in as the stack spreads.
      ...(extra
        ? {
            opacity: spread.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
            transform: [
              { scale: spread.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            ],
          }
        : null),
    };
  };

  const ring = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: RING,
    borderColor: palette.ring,
  };

  return (
    <View
      role="group"
      accessibilityLabel={describe(people)}
      aria-label={describe(people)}
      style={[styles.root, style]}
    >
      {open ? (
        // Pressing anywhere outside folds the stack. Touches outside a parent's bounds are ignored on
        // Android, where the stack's own avatars and the toggle still work.
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={() => setOpen(false)}
          style={styles.backdrop}
        />
      ) : null}
      <View style={styles.row}>
        {shown.map((person, index) => (
          <Animated.View key={person.id} style={avatarStyle(person.id, index, index >= max)}>
            <Pressable
              disabled={!interactive}
              accessibilityRole={interactive ? "button" : undefined}
              accessibilityLabel={person.name}
              accessibilityState={expandOnPress ? { expanded: open } : undefined}
              aria-label={person.name}
              aria-expanded={expandOnPress ? open : undefined}
              hitSlop={hitSlop}
              onPress={() => pressPerson(person)}
              style={[
                styles.avatar,
                ring,
                { backgroundColor: person.image ? palette.plus : colorFor(person.name) },
              ]}
            >
              {person.image ? (
                <Image
                  accessibilityIgnoresInvertColors
                  alt=""
                  source={{ uri: person.image }}
                  style={{
                    width: size - RING * 2,
                    height: size - RING * 2,
                    borderRadius: size / 2,
                  }}
                />
              ) : (
                <Text style={[styles.initials, { color: palette.text, fontSize: size * 0.36 }]}>
                  {initialsOf(person.name)}
                </Text>
              )}
            </Pressable>
          </Animated.View>
        ))}
        {showPlus ? (
          <Animated.View key="plus" style={avatarStyle("plus", shown.length, false)}>
            <Pressable
              disabled={!expandOnPress}
              accessibilityRole={expandOnPress ? "button" : undefined}
              accessibilityLabel={`${hidden} more ${hidden === 1 ? "person" : "people"}`}
              accessibilityState={expandOnPress ? { expanded: open } : undefined}
              aria-label={`${hidden} more ${hidden === 1 ? "person" : "people"}`}
              aria-expanded={expandOnPress ? open : undefined}
              hitSlop={hitSlop}
              onPress={toggle}
              style={[styles.avatar, ring, { backgroundColor: palette.plus }]}
            >
              <Text style={[styles.initials, { color: palette.text, fontSize: size * 0.34 }]}>
                +{hidden}
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: "flex-start" },
  backdrop: { position: "absolute", top: -4000, right: -4000, bottom: -4000, left: -4000 },
  // userSelect keeps a quick double press on the web from selecting the initials.
  row: { flexDirection: "row", alignItems: "center", userSelect: "none" },
  avatar: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  initials: { fontWeight: "700", letterSpacing: 0.3 },
});
