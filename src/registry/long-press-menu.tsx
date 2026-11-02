import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const GAP = 8;

export interface LongPressMenuItem {
  label: string;
  onPress: () => void;
  /** Draws the item in the destructive color. */
  destructive?: boolean;
}

export interface LongPressMenuColors {
  menu: string;
  text: string;
  destructive: string;
  border: string;
}

const DEFAULT_COLORS: LongPressMenuColors = {
  menu: "#ffffff",
  text: "#111827",
  destructive: "#dc2626",
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

interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LongPressMenuProps {
  items: LongPressMenuItem[];
  /** The trigger. Press and hold it to open the menu. */
  children: ReactNode;
  /** How long to hold, in milliseconds. */
  delay?: number;
  /** Which side of the trigger the menu opens on. */
  placement?: "below" | "above";
  colors?: Partial<LongPressMenuColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * Press and hold a trigger to open a menu beside it. The trigger shrinks a little under your finger,
 * the menu springs out from its corner, and choosing an item, tapping elsewhere or pressing Escape
 * folds it away. Every item is also an accessibility action on the trigger, so nothing depends on
 * the long press.
 */
export function LongPressMenu({
  items,
  children,
  delay = 350,
  placement = "below",
  colors,
  style,
}: LongPressMenuProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const rootRef = useRef<ComponentRef<typeof View>>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const squeeze = useRef(new Animated.Value(1)).current;
  const below = placement === "below";

  const spring = (value: Animated.Value, toValue: number) => {
    if (reduceMotion) {
      value.setValue(toValue);
      return;
    }
    Animated.spring(value, {
      toValue,
      stiffness: 380,
      damping: 26,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  useEffect(() => {
    spring(progress, open ? 1 : 0);
    spring(squeeze, open ? 0.96 : 1);
    // spring only reads the reduced-motion flag, which is covered by the dependency below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reduceMotion]);

  useEffect(() => {
    if (!open || Platform.OS !== "web" || typeof document === "undefined") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const show = () => {
    if (Platform.OS === "web") {
      setOpen(true);
      return;
    }
    // The native menu lives in a Modal, which needs the trigger's place on screen.
    rootRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  const choose = (item: LongPressMenuItem) => {
    setOpen(false);
    item.onPress();
  };

  const origin = below ? "top left" : "bottom left";
  const menu = (position: ViewStyle) => (
    <Animated.View
      accessibilityRole="menu"
      pointerEvents={open ? "auto" : "none"}
      style={[
        styles.menu,
        position,
        {
          backgroundColor: palette.menu,
          borderColor: palette.border,
          opacity: progress,
          transformOrigin: origin,
          transform: [
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) },
          ],
        },
      ]}
    >
      {items.map((item, index) => (
        <Pressable
          key={item.label}
          accessibilityRole="menuitem"
          accessibilityLabel={item.label}
          onPress={() => choose(item)}
          style={({ pressed }) => [
            styles.item,
            index > 0 && {
              borderTopColor: palette.border,
              borderTopWidth: StyleSheet.hairlineWidth,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.itemText,
              { color: item.destructive ? palette.destructive : palette.text },
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </Animated.View>
  );

  const trigger = (
    <Animated.View style={{ transform: [{ scale: squeeze }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Long press for options"
        accessibilityActions={items.map((item) => ({ name: item.label, label: item.label }))}
        onAccessibilityAction={(event) =>
          items.find((item) => item.label === event.nativeEvent.actionName)?.onPress()
        }
        aria-haspopup="menu"
        aria-expanded={open}
        delayLongPress={delay}
        onLongPress={show}
        style={styles.trigger}
      >
        {children}
      </Pressable>
    </Animated.View>
  );

  if (Platform.OS !== "web") {
    // Touches outside a parent's bounds are ignored on Android, so an inline backdrop could not catch
    // a tap elsewhere. A transparent Modal covers the screen on native; on the web it would portal
    // out of the docs preview, so the web branch below renders inline instead.
    const windowHeight = Dimensions.get("window").height;
    const position: ViewStyle = anchor
      ? below
        ? { left: anchor.x, top: anchor.y + anchor.height + GAP }
        : { left: anchor.x, bottom: windowHeight - anchor.y + GAP }
      : {};
    return (
      <View ref={rootRef} collapsable={false} style={style}>
        {trigger}
        <Modal
          transparent
          visible={open}
          animationType="none"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable
            accessibilityLabel="Close menu"
            onPress={() => setOpen(false)}
            style={styles.fill}
          />
          {menu(position)}
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.root, { zIndex: open ? 50 : 0 }, style]}>
      {open ? (
        // Oversized and transparent: any press around the trigger closes the menu, and the frame it
        // sits in clips it to the preview.
        <Pressable
          accessibilityLabel="Close menu"
          onPress={() => setOpen(false)}
          style={styles.backdrop}
        />
      ) : null}
      {trigger}
      {menu(
        below
          ? { left: 0, top: "100%", marginTop: GAP }
          : { left: 0, bottom: "100%", marginBottom: GAP },
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: "flex-start" },
  trigger: { alignSelf: "flex-start", userSelect: "none" },
  backdrop: { position: "absolute", top: -3000, right: -3000, bottom: -3000, left: -3000 },
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  menu: {
    position: "absolute",
    minWidth: 190,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 60,
    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.22)",
  },
  item: { paddingHorizontal: 16, paddingVertical: 13, minHeight: 44, justifyContent: "center" },
  itemText: { fontSize: 16, fontWeight: "500" },
  pressed: { opacity: 0.6 },
});
