import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type Mode = "light" | "dark";

export interface ModeToggleColors {
  dayTrack: string;
  nightTrack: string;
  sun: string;
  moon: string;
  star: string;
}

const DEFAULT_COLORS: ModeToggleColors = {
  dayTrack: "#7dd3fc",
  nightTrack: "#1e1b4b",
  sun: "#facc15",
  moon: "#e5e7eb",
  star: "#ffffff",
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

export interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
  size?: "md" | "lg";
  /** Spoken name of the switch. */
  label?: string;
  colors?: Partial<ModeToggleColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A light and dark switch. The sun slides across the sky, its glow turns into a moon as a shadow
 * crosses it, the day sky deepens to night and stars fade in. It reads as a switch that is on when
 * the mode is dark. With reduced motion it jumps between the two states.
 */
export function ModeToggle({
  mode,
  onChange,
  size = "md",
  label = "Dark mode",
  colors,
  style,
}: ModeToggleProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const dark = mode === "dark";
  const m = useRef(new Animated.Value(dark ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      m.setValue(dark ? 1 : 0);
      return;
    }
    // Colours cannot run on the native driver, so the whole toggle is driven from JS.
    Animated.timing(m, {
      toValue: dark ? 1 : 0,
      duration: 380,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [dark, reduceMotion, m]);

  const height = size === "lg" ? 44 : 36;
  const width = height * 2;
  const pad = 4;
  const thumb = height - pad * 2;

  const track = m.interpolate({
    inputRange: [0, 1],
    outputRange: [palette.dayTrack, palette.nightTrack],
  });
  const body = m.interpolate({ inputRange: [0, 1], outputRange: [palette.sun, palette.moon] });
  const x = m.interpolate({ inputRange: [0, 1], outputRange: [pad, width - thumb - pad] });
  const shadowX = m.interpolate({ inputRange: [0, 1], outputRange: [thumb, thumb * 0.35] });
  const stars = m.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] });

  const star = (left: number, top: number, s: number) => (
    <Animated.View
      key={`${left}-${top}`}
      style={{
        position: "absolute",
        left,
        top,
        width: s,
        height: s,
        borderRadius: s / 2,
        backgroundColor: palette.star,
        opacity: stars,
      }}
    />
  );

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: dark }}
      aria-checked={dark}
      onPress={() => onChange(dark ? "light" : "dark")}
      style={[styles.hit, style]}
    >
      <Animated.View
        style={[styles.track, { width, height, borderRadius: height / 2, backgroundColor: track }]}
      >
        {star(height * 0.3, height * 0.28, 3)}
        {star(height * 0.55, height * 0.6, 2)}
        {star(height * 0.8, height * 0.22, 2)}
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumb,
              height: thumb,
              borderRadius: thumb / 2,
              backgroundColor: body,
              transform: [{ translateX: x }],
            },
          ]}
        >
          <Animated.View
            style={{
              position: "absolute",
              top: -thumb * 0.1,
              width: thumb,
              height: thumb,
              borderRadius: thumb / 2,
              backgroundColor: track,
              transform: [{ translateX: shadowX }],
            }}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { alignSelf: "flex-start", userSelect: "none" },
  track: { justifyContent: "center", overflow: "hidden" },
  thumb: { position: "absolute", top: 4, overflow: "hidden" },
});
