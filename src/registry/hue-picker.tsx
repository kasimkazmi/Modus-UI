import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
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
const THUMB = 28;
const TRACK_INSET = 5;
const HUE_SEGMENTS = 72;
const LIGHT_SEGMENTS = 24;
const STEP = 5;
// Hue 360 is the same colour as 0, so the far end of the strip stops just short of it and the thumb
// never jumps back to the start.
const MAX_HUE = 359.99;
const FALLBACK = "#4f46e5";

export interface HuePickerColors {
  ring: string;
  text: string;
}

const DEFAULT_COLORS: HuePickerColors = {
  ring: "#111827",
  text: "#111827",
};

const DEFAULT_SWATCHES = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

const HUE_COLORS = Array.from(
  { length: HUE_SEGMENTS },
  (_, i) => `hsl(${(i + 0.5) * (360 / HUE_SEGMENTS)}, 100%, 50%)`,
);

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

interface Hsl {
  /** Degrees, 0 to 360. */
  h: number;
  /** Percent. */
  s: number;
  /** Percent. */
  l: number;
}

/** "#abc" or "#aabbcc", any case, to "#aabbcc"; null when it is not a hex colour. */
function normalizeHex(input: string): string | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!match) return null;
  const digits = match[1].toLowerCase();
  const full = digits.length === 3 ? digits.replace(/./g, (c) => c + c) : digits;
  return `#${full}`;
}

function hexToHsl(hex: string): Hsl {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 };
}

function hslToHex({ h, s, l }: Hsl): string {
  const sat = s / 100;
  const light = l / 100;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const sector = (((h % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((sector % 2) - 1));
  const [r, g, b] =
    sector < 1
      ? [chroma, x, 0]
      : sector < 2
        ? [x, chroma, 0]
        : sector < 3
          ? [0, chroma, x]
          : sector < 4
            ? [0, x, chroma]
            : sector < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const m = light - chroma / 2;
  const byte = (v: number) =>
    Math.max(0, Math.min(255, Math.round((v + m) * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

export interface HuePickerProps {
  /** The colour as a hex string such as "#4f46e5". Expected to echo `onChange`. */
  value: string;
  /** Called with a lowercase "#rrggbb" string as the colour changes. */
  onChange: (hex: string) => void;
  /** Colours offered as one-tap swatches. */
  swatches?: string[];
  /** Show the hex text next to the preview. */
  showValue?: boolean;
  colors?: Partial<HuePickerColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A colour picker built from plain Views: a hue strip, a lightness strip for the chosen hue, and
 * swatches. Hue, saturation and lightness are kept as numbers while you drag and only turned into
 * hex on the way out, so the hex never drifts and the hue survives passing through black or white.
 */
export function HuePicker({
  value,
  onChange,
  swatches = DEFAULT_SWATCHES,
  showValue = true,
  colors,
  style,
}: HuePickerProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const initial = normalizeHex(value) ?? FALLBACK;
  const [hsl, setHsl] = useState<Hsl>(() => hexToHsl(initial));
  const [width, setWidth] = useState(0);
  const emitted = useRef(initial);
  const dragging = useRef<"hue" | "light" | null>(null);
  const placed = useRef(false);
  const start = useRef(0);
  const hueX = useRef(new Animated.Value(0)).current;
  const lightX = useRef(new Animated.Value(0)).current;
  const hueGrow = useRef(new Animated.Value(0)).current;
  const lightGrow = useRef(new Animated.Value(0)).current;

  const span = Math.max(0, width - THUMB);
  const hex = hslToHex(hsl);

  // The responders are created once, so they read the latest values from here.
  const live = useRef({ hsl, onChange, span, reduceMotion });
  live.current = { hsl: live.current.hsl, onChange, span, reduceMotion };

  // Adopt a colour the parent changed, but not the one we just reported.
  useEffect(() => {
    const next = normalizeHex(value);
    if (next && next !== emitted.current) {
      emitted.current = next;
      const parsed = hexToHsl(next);
      live.current.hsl = parsed;
      setHsl(parsed);
    }
  }, [value]);

  const apply = (next: Hsl) => {
    live.current.hsl = next;
    setHsl(next);
    const nextHex = hslToHex(next);
    if (nextHex !== emitted.current) {
      emitted.current = nextHex;
      live.current.onChange(nextHex);
    }
  };

  const spring = (node: Animated.Value, toValue: number) => {
    if (live.current.reduceMotion) {
      node.setValue(toValue);
      return;
    }
    Animated.spring(node, {
      toValue,
      stiffness: 420,
      damping: 28,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  // Put the thumbs where the colour says. Dragging moves them directly, so skip it then.
  useEffect(() => {
    if (span <= 0 || dragging.current) return;
    const targets: [Animated.Value, number][] = [
      [hueX, (hsl.h / 360) * span],
      [lightX, (hsl.l / 100) * span],
    ];
    for (const [node, px] of targets) {
      if (!placed.current) node.setValue(px);
      else spring(node, px);
    }
    placed.current = true;
    // spring reads from refs; the dependencies below are what should re-run it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hsl.h, hsl.l, span, reduceMotion]);

  const move = (kind: "hue" | "light", x: number) => {
    const room = live.current.span;
    if (room <= 0) return;
    const ratio = Math.max(0, Math.min(1, (x - THUMB / 2) / room));
    if (kind === "hue") {
      hueX.setValue(ratio * room);
      apply({ ...live.current.hsl, h: Math.min(MAX_HUE, ratio * 360) });
    } else {
      lightX.setValue(ratio * room);
      apply({ ...live.current.hsl, l: ratio * 100 });
    }
  };

  const makePan = (kind: "hue" | "light") => {
    const grow = kind === "hue" ? hueGrow : lightGrow;
    const finish = () => {
      if (dragging.current !== kind) return;
      dragging.current = null;
      spring(grow, 0);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        dragging.current = kind;
        start.current = event.nativeEvent.locationX;
        spring(grow, 1);
        // Touching the strip puts the thumb under the finger.
        move(kind, start.current);
      },
      onPanResponderMove: (_, g) => move(kind, start.current + g.dx),
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    });
  };
  const huePan = useRef(makePan("hue")).current;
  const lightPan = useRef(makePan("light")).current;

  const nudge = (kind: "hue" | "light", direction: 1 | -1) => {
    const current = live.current.hsl;
    if (kind === "hue") {
      apply({ ...current, h: Math.max(0, Math.min(MAX_HUE, current.h + direction * STEP)) });
    } else {
      apply({ ...current, l: Math.max(0, Math.min(100, current.l + direction * STEP)) });
    }
  };

  const choose = (swatch: string) => {
    const normal = normalizeHex(swatch);
    if (!normal) return;
    const parsed = hexToHsl(normal);
    live.current.hsl = parsed;
    setHsl(parsed);
    if (normal !== emitted.current) {
      emitted.current = normal;
      live.current.onChange(normal);
    }
  };

  // The lightness strip runs dark to light in the chosen hue and saturation.
  const hueKey = Math.round(hsl.h);
  const satKey = Math.round(hsl.s);
  const lightColors = useMemo(
    () =>
      Array.from(
        { length: LIGHT_SEGMENTS },
        (_, i) => `hsl(${hueKey}, ${satKey}%, ${(i / (LIGHT_SEGMENTS - 1)) * 100}%)`,
      ),
    [hueKey, satKey],
  );

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.root, style]}
    >
      <View style={styles.preview}>
        <View style={[styles.chip, { backgroundColor: hex }]} />
        {showValue ? <Text style={[styles.hex, { color: palette.text }]}>{hex}</Text> : null}
      </View>
      <Strip
        label="Hue"
        segments={HUE_COLORS}
        x={hueX}
        grow={hueGrow}
        thumbColor={`hsl(${hueKey}, 100%, 50%)`}
        panHandlers={huePan.panHandlers}
        now={Math.round(hsl.h)}
        max={360}
        text={`${Math.round(hsl.h)} degrees`}
        onNudge={(direction) => nudge("hue", direction)}
      />
      <Strip
        label="Lightness"
        segments={lightColors}
        x={lightX}
        grow={lightGrow}
        thumbColor={hex}
        panHandlers={lightPan.panHandlers}
        now={Math.round(hsl.l)}
        max={100}
        text={`${Math.round(hsl.l)} percent`}
        onNudge={(direction) => nudge("light", direction)}
      />
      <View style={styles.swatches}>
        {swatches.map((swatch, index) => (
          <Swatch
            key={`swatch-${index}`}
            hex={normalizeHex(swatch) ?? swatch}
            selected={normalizeHex(swatch) === hex}
            ring={palette.ring}
            reduceMotion={reduceMotion}
            onPress={() => choose(swatch)}
          />
        ))}
      </View>
    </View>
  );
}

function Strip({
  label,
  segments,
  x,
  grow,
  thumbColor,
  panHandlers,
  now,
  max,
  text,
  onNudge,
}: {
  label: string;
  segments: string[];
  x: Animated.Value;
  grow: Animated.Value;
  thumbColor: string;
  panHandlers: object;
  now: number;
  max: number;
  text: string;
  onNudge: (direction: 1 | -1) => void;
}) {
  // Built once so react-native-web never restarts a running spring when this re-renders.
  const thumbStyle = useMemo(
    () => ({
      transform: [
        { translateX: x },
        { scale: grow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) },
      ],
    }),
    [x, grow],
  );

  return (
    <View
      {...panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      aria-label={label}
      accessibilityValue={{ min: 0, max, now, text }}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={now}
      aria-valuetext={text}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) =>
        onNudge(event.nativeEvent.actionName === "increment" ? 1 : -1)
      }
      style={styles.strip}
    >
      <View pointerEvents="none" style={styles.clip}>
        {segments.map((color, index) => (
          <View key={`segment-${index}`} style={[styles.segment, { backgroundColor: color }]} />
        ))}
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.thumb, { backgroundColor: thumbColor }, thumbStyle]}
      />
    </View>
  );
}

function Swatch({
  hex,
  selected,
  ring,
  reduceMotion,
  onPress,
}: {
  hex: string;
  selected: boolean;
  ring: string;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  const shown = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      shown.setValue(selected ? 1 : 0);
      return;
    }
    Animated.spring(shown, {
      toValue: selected ? 1 : 0,
      stiffness: 420,
      damping: 24,
      mass: 1,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [selected, reduceMotion, shown]);

  const ringStyle = useMemo(
    () => ({
      opacity: shown,
      transform: [{ scale: shown.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }],
    }),
    [shown],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hex}
      aria-label={hex}
      accessibilityState={{ selected }}
      aria-selected={selected}
      hitSlop={6}
      onPress={onPress}
      style={styles.swatchHit}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.swatchRing, { borderColor: ring }, ringStyle]}
      />
      <View style={[styles.swatch, { backgroundColor: hex }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // userSelect keeps a mouse drag on the web from selecting text instead of moving a thumb.
  root: { alignSelf: "stretch", gap: 16, userSelect: "none" },
  preview: { flexDirection: "row", alignItems: "center", gap: 12 },
  chip: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
  },
  hex: { fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
  strip: { height: THUMB, justifyContent: "center" },
  clip: {
    position: "absolute",
    top: TRACK_INSET,
    bottom: TRACK_INSET,
    left: 0,
    right: 0,
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
  },
  segment: { flex: 1 },
  thumb: {
    position: "absolute",
    left: 0,
    top: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    borderColor: "#ffffff",
    boxShadow: "0 1px 5px rgba(0, 0, 0, 0.35)",
  },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatchHit: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  swatch: { width: 26, height: 26, borderRadius: 13 },
  swatchRing: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 17,
    borderWidth: 2.5,
  },
});
