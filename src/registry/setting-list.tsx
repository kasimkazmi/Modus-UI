import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const TRACK_W = 46;
const TRACK_H = 28;
const THUMB = 22;

export interface SettingItem {
  id: string;
  label: string;
  /** A glyph or small view shown in a tile at the start of the row. */
  icon?: ReactNode;
  /** A smaller line under the label. */
  description?: string;
  /** "link" shows a chevron, "value" shows `value`, "toggle" a switch, and "info" is not pressable. */
  kind?: "link" | "value" | "toggle" | "info";
  value?: string;
  checked?: boolean;
  onPress?: () => void;
  onToggle?: (next: boolean) => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface SettingListColors {
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  destructive: string;
  tile: string;
  track: string;
}

const DEFAULT_COLORS: SettingListColors = {
  surface: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  accent: "#4f46e5",
  destructive: "#dc2626",
  tile: "#f3f4f6",
  track: "#d1d5db",
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

function Switch({
  on,
  accent,
  track,
  reduceMotion,
}: {
  on: boolean;
  accent: string;
  track: string;
  reduceMotion: boolean;
}) {
  const t = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) {
      t.setValue(on ? 1 : 0);
      return;
    }
    Animated.spring(t, {
      toValue: on ? 1 : 0,
      stiffness: 420,
      damping: 26,
      mass: 1,
      useNativeDriver: false,
    }).start();
  }, [on, reduceMotion, t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        width: TRACK_W,
        height: TRACK_H,
        borderRadius: TRACK_H / 2,
        justifyContent: "center",
        backgroundColor: t.interpolate({ inputRange: [0, 1], outputRange: [track, accent] }),
      }}
    >
      <Animated.View
        style={{
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
          transform: [
            {
              translateX: t.interpolate({
                inputRange: [0, 1],
                outputRange: [3, TRACK_W - THUMB - 3],
              }),
            },
          ],
        }}
      />
    </Animated.View>
  );
}

export interface SettingListProps {
  items: SettingItem[];
  /** A small heading above the group. */
  header?: string;
  /** Explanatory text under the group. */
  footer?: string;
  colors?: Partial<SettingListColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A grouped settings list in the style of a phone's own settings screen: rounded rows split by
 * hairlines, with an icon tile, a label and a description, and a chevron, a value or a switch on the
 * right. Switches are real switches to screen readers, and a pressed row highlights.
 */
export function SettingList({ items, header, footer, colors, style }: SettingListProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();

  return (
    <View style={style}>
      {header ? (
        <Text style={[styles.header, { color: palette.muted }]}>{header.toUpperCase()}</Text>
      ) : null}
      <View
        style={[styles.group, { backgroundColor: palette.surface, borderColor: palette.border }]}
      >
        {items.map((item, i) => {
          const kind = item.kind ?? "link";
          const toggle = kind === "toggle";
          const pressable = kind !== "info" && !item.disabled;
          const color = item.destructive ? palette.destructive : palette.text;
          const spoken = [item.label, item.description, kind === "value" ? item.value : undefined]
            .filter(Boolean)
            .join(", ");
          return (
            <Pressable
              key={item.id}
              accessibilityRole={toggle ? "switch" : kind === "info" ? "text" : "button"}
              accessibilityLabel={spoken}
              accessibilityState={
                toggle
                  ? { checked: !!item.checked, disabled: !!item.disabled }
                  : { disabled: !!item.disabled }
              }
              aria-checked={toggle ? !!item.checked : undefined}
              aria-disabled={!!item.disabled}
              disabled={!pressable}
              onPress={() => (toggle ? item.onToggle?.(!item.checked) : item.onPress?.())}
              style={({ pressed }) => [
                styles.row,
                i > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: palette.border,
                },
                pressed && { backgroundColor: palette.tile },
                item.disabled && styles.disabled,
              ]}
            >
              {item.icon ? (
                <View style={[styles.tile, { backgroundColor: palette.tile }]}>{item.icon}</View>
              ) : null}
              <View style={styles.text}>
                <Text style={[styles.label, { color }]}>{item.label}</Text>
                {item.description ? (
                  <Text style={[styles.description, { color: palette.muted }]}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              {toggle ? (
                <Switch
                  on={!!item.checked}
                  accent={palette.accent}
                  track={palette.track}
                  reduceMotion={reduceMotion}
                />
              ) : (
                <View style={styles.end}>
                  {item.value && (kind === "value" || kind === "link" || kind === "info") ? (
                    <Text style={[styles.value, { color: palette.muted }]}>{item.value}</Text>
                  ) : null}
                  {kind === "link" ? (
                    <Text style={[styles.chevron, { color: palette.muted }]}>›</Text>
                  ) : null}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      {footer ? <Text style={[styles.footer, { color: palette.muted }]}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6, marginLeft: 14 },
  group: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    userSelect: "none",
  },
  tile: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 1 },
  label: { fontSize: 16, fontWeight: "500" },
  description: { fontSize: 13 },
  end: { flexDirection: "row", alignItems: "center", gap: 6 },
  value: { fontSize: 15 },
  chevron: { fontSize: 24, lineHeight: 26 },
  footer: { fontSize: 13, lineHeight: 18, marginTop: 6, marginHorizontal: 14 },
  disabled: { opacity: 0.45 },
});
