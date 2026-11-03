import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";

export interface BatteryMeterColors {
  outline: string;
  low: string;
  ok: string;
  charging: string;
  text: string;
}

const DEFAULT_COLORS: BatteryMeterColors = {
  outline: "#9ca3af",
  low: "#dc2626",
  ok: "#16a34a",
  charging: "#f59e0b",
  text: "#111827",
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

export interface BatteryMeterProps {
  /** Charge from 0 to 1. */
  level: number;
  /** Shows the charging colour and a bolt that pulses. */
  charging?: boolean;
  /** Width of the battery. */
  width?: number;
  /** Shows the percentage beside it. */
  showPercent?: boolean;
  colors?: Partial<BatteryMeterColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A battery gauge. The fill slides to the charge level and turns red below 20 percent, amber while
 * charging, and green otherwise. While charging a bolt pulses over the cell. The level is read out
 * with whether it is charging.
 */
export function BatteryMeter({
  level,
  charging = false,
  width = 64,
  showPercent = true,
  colors,
  style,
}: BatteryMeterProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const clamped = Math.max(0, Math.min(1, level));
  const percent = Math.round(clamped * 100);
  const fill = useRef(new Animated.Value(clamped)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const tint = charging ? palette.charging : clamped < 0.2 ? palette.low : palette.ok;
  const height = width * 0.5;

  useEffect(() => {
    if (reduceMotion) fill.setValue(clamped);
    else
      Animated.timing(fill, {
        toValue: clamped,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
  }, [clamped, reduceMotion, fill]);

  useEffect(() => {
    if (!charging || reduceMotion) {
      pulse.setValue(charging ? 1 : 0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE_DRIVER,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [charging, reduceMotion, pulse]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Battery ${percent} percent${charging ? ", charging" : ""}`}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      style={[styles.row, style]}
    >
      <View style={styles.body}>
        <View
          style={[
            styles.shell,
            { width, height, borderColor: palette.outline, borderRadius: height * 0.28 },
          ]}
        >
          <Animated.View
            style={{
              margin: 3,
              height: height - 6 - 4,
              borderRadius: height * 0.18,
              backgroundColor: tint,
              width: fill.interpolate({ inputRange: [0, 1], outputRange: [0, width - 6 - 4] }),
            }}
          />
          <Animated.View pointerEvents="none" style={[styles.bolt, { opacity: pulse }]}>
            <Text style={[styles.boltText, { fontSize: height * 0.6 }]}>⚡</Text>
          </Animated.View>
        </View>
        <View style={[styles.cap, { height: height * 0.4, backgroundColor: palette.outline }]} />
      </View>
      {showPercent ? (
        <Text style={[styles.percent, { color: palette.text }]}>{percent}%</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "flex-start" },
  body: { flexDirection: "row", alignItems: "center" },
  shell: { borderWidth: 2, justifyContent: "center", overflow: "hidden" },
  cap: { width: 4, borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  bolt: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  boltText: { color: "#ffffff" },
  percent: { fontSize: 15, fontWeight: "700", minWidth: 40 },
});
