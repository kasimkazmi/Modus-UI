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

export type ChatStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ChatBubbleColors {
  mine: string;
  theirs: string;
  mineText: string;
  theirsText: string;
  meta: string;
  read: string;
  failed: string;
}

const DEFAULT_COLORS: ChatBubbleColors = {
  mine: "#4f46e5",
  theirs: "#f3f4f6",
  mineText: "#ffffff",
  theirsText: "#111827",
  meta: "#9ca3af",
  read: "#38bdf8",
  failed: "#dc2626",
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

const STATUS_TEXT: Record<ChatStatus, string> = {
  sending: "sending",
  sent: "sent",
  delivered: "delivered",
  read: "read",
  failed: "failed to send",
};

export interface ChatBubbleProps {
  /** The message text. */
  text?: string;
  /** Replaces the text, for an image or any other content. */
  children?: ReactNode;
  /** Whose message it is: your own sit on the right. */
  side?: "me" | "them";
  /** The sender's name, read out and shown above messages from others. */
  name?: string;
  /** The time shown under the message, for example "9:41". */
  time?: string;
  /** Delivery state of one of your own messages. */
  status?: ChatStatus;
  /** Draws the small tail. Turn it off for all but the last message of a run. */
  tail?: boolean;
  /** Called when a failed message is pressed. */
  onRetry?: () => void;
  /** Slides and scales the bubble in when it first appears. */
  animateIn?: boolean;
  colors?: Partial<ChatBubbleColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A chat message bubble. It springs in from its own corner, shows delivery ticks that turn to read,
 * and a failed message becomes a retry button. A run of messages from one sender shares a single tail.
 * The sender, text, time and delivery state are read out as one sentence.
 */
export function ChatBubble({
  text,
  children,
  side = "them",
  name,
  time,
  status,
  tail = true,
  onRetry,
  animateIn = true,
  colors,
  style,
}: ChatBubbleProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const mine = side === "me";
  const enter = useRef(new Animated.Value(animateIn ? 0 : 1)).current;

  useEffect(() => {
    if (!animateIn || reduceMotion) {
      enter.setValue(1);
      return;
    }
    Animated.spring(enter, {
      toValue: 1,
      stiffness: 360,
      damping: 24,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
    // The entrance plays once, when the bubble mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const failed = status === "failed";
  const bubbleColor = mine ? palette.mine : palette.theirs;
  const textColor = mine ? palette.mineText : palette.theirsText;
  const spoken = [
    mine ? "You" : (name ?? "Them"),
    text ?? "attachment",
    time,
    mine && status ? STATUS_TEXT[status] : undefined,
  ]
    .filter(Boolean)
    .join(", ");

  const ticks =
    status === "sending"
      ? "…"
      : status === "sent"
        ? "✓"
        : status === "delivered" || status === "read"
          ? "✓✓"
          : "";

  const body = (
    <View
      accessible
      accessibilityLabel={spoken}
      aria-label={spoken}
      style={[
        styles.bubble,
        { backgroundColor: failed ? palette.failed : bubbleColor },
        mine ? styles.mineCorner : styles.theirCorner,
        !tail && styles.noTail,
      ]}
    >
      {!mine && name ? <Text style={[styles.name, { color: palette.meta }]}>{name}</Text> : null}
      {children ?? (
        <Text style={[styles.text, { color: failed ? "#ffffff" : textColor }]}>{text}</Text>
      )}
      {time || ticks ? (
        <View style={styles.meta}>
          {time ? (
            <Text style={[styles.time, { color: mine ? "rgba(255,255,255,0.75)" : palette.meta }]}>
              {time}
            </Text>
          ) : null}
          {mine && ticks ? (
            <Text
              style={[
                styles.ticks,
                { color: status === "read" ? palette.read : "rgba(255,255,255,0.75)" },
              ]}
            >
              {ticks}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.row,
        mine ? styles.rowMine : styles.rowTheirs,
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) },
          ],
        },
        style,
      ]}
    >
      {failed && onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Message failed to send. Tap to retry"
          onPress={onRetry}
          style={styles.retry}
        >
          <Text style={[styles.retryGlyph, { color: palette.failed }]}>↻</Text>
        </Pressable>
      ) : null}
      {body}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", marginVertical: 2, paddingHorizontal: 12 },
  rowMine: { justifyContent: "flex-end", transformOrigin: "right bottom" },
  rowTheirs: { justifyContent: "flex-start", transformOrigin: "left bottom" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 18,
  },
  mineCorner: { borderBottomRightRadius: 5 },
  theirCorner: { borderBottomLeftRadius: 5 },
  noTail: { borderBottomRightRadius: 18, borderBottomLeftRadius: 18 },
  name: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  text: { fontSize: 16, lineHeight: 22 },
  meta: { flexDirection: "row", alignSelf: "flex-end", alignItems: "center", gap: 4, marginTop: 2 },
  time: { fontSize: 11 },
  ticks: { fontSize: 11, fontWeight: "700", letterSpacing: -1 },
  retry: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: 2 },
  retryGlyph: { fontSize: 24, fontWeight: "700" },
});
