import { useEffect, useMemo, useRef, useState, type ElementRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const SIZE = 44;
const CANCEL_WIDTH = 76;

export interface ExpandSearchColors {
  field: string;
  icon: string;
  text: string;
  placeholder: string;
}

const DEFAULT_COLORS: ExpandSearchColors = {
  field: "#f3f4f6",
  icon: "#374151",
  text: "#111827",
  placeholder: "#9ca3af",
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

export interface ExpandSearchProps {
  /** The text in the field. Leave it out to let the component keep the text itself. */
  value?: string;
  onChangeText?: (text: string) => void;
  /** Called when the keyboard's search key is pressed. */
  onSubmit?: (text: string) => void;
  placeholder?: string;
  /** Whether the field starts open. */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  colors?: Partial<ExpandSearchColors>;
  /** Style for the container, which is as wide as its parent allows. Place it with this. */
  style?: StyleProp<ViewStyle>;
}

/**
 * A search field that starts as a round button and springs open to the full width, where the cursor
 * is waiting. A clear button shows while there is text, and Cancel (or Escape on the web) folds the
 * field away and clears it. The magnifier is drawn with plain views, so there is no icon package.
 */
export function ExpandSearch({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Search",
  defaultExpanded = false,
  onExpandedChange,
  colors,
  style,
}: ExpandSearchProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [inner, setInner] = useState("");
  const [width, setWidth] = useState(0);
  const input = useRef<ElementRef<typeof TextInput>>(null);
  // 0 is the round button, 1 the open field. Width is not a native-driver property.
  const progress = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const text = value ?? inner;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(expanded ? 1 : 0);
      return;
    }
    Animated.spring(progress, {
      toValue: expanded ? 1 : 0,
      stiffness: 320,
      damping: 30,
      mass: 1,
      useNativeDriver: false,
    }).start();
  }, [expanded, reduceMotion, progress]);

  // Built once per width so react-native-web does not restart the spring on every keystroke.
  const motion = useMemo(
    () => ({
      fieldWidth: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [SIZE, Math.max(SIZE, width - CANCEL_WIDTH)],
      }),
      cancelOffset: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
    }),
    [progress, width],
  );

  const change = (next: string) => {
    setInner(next);
    onChangeText?.(next);
  };

  const open = () => {
    setExpanded(true);
    onExpandedChange?.(true);
    // Focus inside the press so mobile browsers raise the keyboard.
    input.current?.focus();
  };

  const close = () => {
    input.current?.blur();
    change("");
    setExpanded(false);
    onExpandedChange?.(false);
  };

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.root, style]}
    >
      <Animated.View
        style={[styles.field, { width: motion.fieldWidth, backgroundColor: palette.field }]}
      >
        <Pressable
          accessible={!expanded}
          accessibilityRole="button"
          accessibilityLabel="Search"
          onPress={expanded ? () => input.current?.focus() : open}
          style={styles.iconSlot}
        >
          <View style={styles.magnifier}>
            <View style={[styles.ring, { borderColor: palette.icon }]} />
            <View style={[styles.handle, { backgroundColor: palette.icon }]} />
          </View>
        </Pressable>
        <Animated.View
          pointerEvents={expanded ? "auto" : "none"}
          style={[styles.inputSlot, { opacity: progress }]}
        >
          <TextInput
            ref={input}
            accessibilityRole="search"
            accessibilityLabel={placeholder}
            value={text}
            onChangeText={change}
            onSubmitEditing={() => onSubmit?.(text)}
            onKeyPress={(event) => {
              if (event.nativeEvent.key === "Escape") close();
            }}
            placeholder={placeholder}
            placeholderTextColor={palette.placeholder}
            returnKeyType="search"
            autoCorrect={false}
            tabIndex={expanded ? 0 : -1}
            style={[styles.input, { color: palette.text }]}
          />
        </Animated.View>
        {expanded && text.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
            onPress={() => {
              change("");
              input.current?.focus();
            }}
            style={[styles.clear, { backgroundColor: palette.placeholder }]}
          >
            <Text style={[styles.clearGlyph, { color: palette.field }]}>×</Text>
          </Pressable>
        ) : null}
      </Animated.View>
      <Animated.View
        pointerEvents={expanded ? "auto" : "none"}
        style={[
          styles.cancel,
          { opacity: progress, transform: [{ translateX: motion.cancelOffset }] },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={close}
          style={styles.cancelPress}
        >
          <Text style={[styles.cancelText, { color: palette.text }]}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%", height: SIZE, flexDirection: "row", alignItems: "center" },
  field: {
    height: SIZE,
    borderRadius: SIZE / 2,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  iconSlot: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  magnifier: { width: 18, height: 18 },
  ring: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  handle: {
    position: "absolute",
    left: 9.2,
    top: 11.7,
    width: 7,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
  },
  inputSlot: { flex: 1, height: SIZE, justifyContent: "center" },
  input: { height: SIZE, fontSize: 16, paddingRight: 8, outlineWidth: 0 },
  clear: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  clearGlyph: { fontSize: 16, lineHeight: 18, fontWeight: "700" },
  cancel: { position: "absolute", right: 0, width: CANCEL_WIDTH, height: SIZE },
  cancelPress: { flex: 1, alignItems: "center", justifyContent: "center", paddingLeft: 8 },
  cancelText: { fontSize: 16, fontWeight: "500" },
});
