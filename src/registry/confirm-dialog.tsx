import { useEffect, useRef, useState, type ElementRef } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
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
// Past this many characters a label no longer fits two side-by-side buttons.
const LONG_LABEL = 14;

export interface ConfirmDialogColors {
  surface: string;
  backdrop: string;
  title: string;
  message: string;
  border: string;
  cancelText: string;
  confirm: string;
  confirmText: string;
  destructive: string;
}

const DEFAULT_COLORS: ConfirmDialogColors = {
  surface: "#ffffff",
  backdrop: "rgba(0, 0, 0, 0.5)",
  title: "#111827",
  message: "#6b7280",
  border: "#e5e7eb",
  cancelText: "#111827",
  confirm: "#4f46e5",
  confirmText: "#ffffff",
  destructive: "#dc2626",
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

export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as a warning, for actions that cannot be undone. */
  destructive?: boolean;
  /** Shows a spinner in the confirm button and disables the dialog while work is under way. */
  loading?: boolean;
  colors?: Partial<ConfirmDialogColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A centred alert dialog, drawn inside its parent so it works in a screen, a tab or a Modal alike.
 * It pops in on a spring over a dimmed backdrop. On the web focus starts on Cancel, so pressing Enter
 * can never confirm a destructive action by accident, and Escape cancels. While `loading` it cannot
 * be dismissed.
 */
export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  colors,
  style,
}: ConfirmDialogProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const t = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(open);
  const cancelButton = useRef<ElementRef<typeof View>>(null);

  const live = useRef({ onCancel, loading });
  live.current = { onCancel, loading };

  useEffect(() => {
    if (open) setMounted(true);
    if (reduceMotion) {
      t.setValue(open ? 1 : 0);
      if (!open) setMounted(false);
      return;
    }
    Animated.spring(t, {
      toValue: open ? 1 : 0,
      stiffness: 360,
      damping: 28,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open, reduceMotion, t]);

  // Web: start on Cancel and let Escape cancel.
  useEffect(() => {
    if (!open || !mounted || Platform.OS !== "web") return;
    const focus = setTimeout(
      () => (cancelButton.current as unknown as HTMLElement | null)?.focus?.(),
      30,
    );
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !live.current.loading) live.current.onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(focus);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, mounted]);

  if (!mounted) return null;

  const stacked = confirmLabel.length > LONG_LABEL || cancelLabel.length > LONG_LABEL;
  const accent = destructive ? palette.destructive : palette.confirm;

  return (
    <View style={styles.root} pointerEvents={open ? "auto" : "none"}>
      <Animated.View
        aria-hidden
        style={[styles.fill, { backgroundColor: palette.backdrop, opacity: t }]}
      >
        <Pressable accessible={false} disabled={loading} onPress={onCancel} style={styles.fill} />
      </Animated.View>
      <Animated.View
        role="alertdialog"
        accessibilityLabel={title}
        aria-label={title}
        aria-modal
        accessibilityViewIsModal
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            opacity: t,
            transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
          },
          style,
        ]}
      >
        <Text style={[styles.title, { color: palette.title }]}>{title}</Text>
        {message ? (
          <Text style={[styles.message, { color: palette.message }]}>{message}</Text>
        ) : null}
        <View style={[styles.buttons, stacked && styles.stacked]}>
          <Pressable
            ref={cancelButton}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            accessibilityState={{ disabled: loading }}
            aria-disabled={loading}
            disabled={loading}
            onPress={onCancel}
            style={({ pressed }) => [
              styles.button,
              { borderColor: palette.border, borderWidth: 1 },
              stacked && styles.fullWidth,
              (pressed || loading) && styles.dim,
            ]}
          >
            <Text style={[styles.buttonText, { color: palette.cancelText }]}>{cancelLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={loading ? `${confirmLabel}, working` : confirmLabel}
            accessibilityState={{ disabled: loading, busy: loading }}
            aria-disabled={loading}
            aria-busy={loading}
            disabled={loading}
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: accent },
              stacked && styles.fullWidth,
              pressed && styles.dim,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={palette.confirmText} />
            ) : (
              <Text style={[styles.buttonText, { color: palette.confirmText }]}>
                {confirmLabel}
              </Text>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 20,
    padding: 20,
    gap: 8,
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
  },
  title: { fontSize: 18, fontWeight: "700" },
  message: { fontSize: 15, lineHeight: 21 },
  buttons: { flexDirection: "row", gap: 10, marginTop: 14 },
  stacked: { flexDirection: "column-reverse" },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    userSelect: "none",
  },
  fullWidth: { flex: 0, width: "100%" },
  buttonText: { fontSize: 15, fontWeight: "600" },
  dim: { opacity: 0.7 },
});
