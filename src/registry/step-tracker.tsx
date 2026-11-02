import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
const NODE = 32;
// Width of a step's column in the horizontal layout; the connectors share what is left.
const COLUMN = 64;

export interface StepTrackerStep {
  id: string;
  title: string;
  description?: string;
}

export interface StepTrackerColors {
  complete: string;
  current: string;
  upcoming: string;
  line: string;
  text: string;
  mutedText: string;
}

const DEFAULT_COLORS: StepTrackerColors = {
  complete: "#16a34a",
  current: "#4f46e5",
  upcoming: "#d1d5db",
  line: "#e5e7eb",
  text: "#111827",
  mutedText: "#6b7280",
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

type Status = "complete" | "current" | "upcoming";

export interface StepTrackerProps {
  steps: StepTrackerStep[];
  /** Index of the step in progress. Earlier steps are complete; a value past the end completes all. */
  current: number;
  orientation?: "vertical" | "horizontal";
  colors?: Partial<StepTrackerColors>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A progress tracker made from plain Views. Complete steps show a check that pops in, the step in
 * progress has a soft pulsing ring, and the connector between two steps fills as `current` moves
 * past it. Vertical rows size to their text; horizontal columns give titles two lines.
 */
export function StepTracker({
  steps,
  current,
  orientation = "vertical",
  colors,
  style,
}: StepTrackerProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const vertical = orientation === "vertical";

  const statusOf = (index: number): Status =>
    index < current ? "complete" : index === current ? "current" : "upcoming";

  const labelOf = (step: StepTrackerStep, index: number, status: Status) =>
    `Step ${index + 1} of ${steps.length}: ${step.title}, ${status}${
      step.description ? `. ${step.description}` : ""
    }`;

  return (
    <View role="list" style={[vertical ? undefined : styles.horizontal, style]}>
      {steps.map((step, index) => {
        const status = statusOf(index);
        const last = index === steps.length - 1;
        const titleColor = status === "upcoming" ? palette.mutedText : palette.text;

        if (vertical) {
          return (
            <View
              key={step.id}
              role="listitem"
              accessible
              accessibilityLabel={labelOf(step, index, status)}
              aria-current={status === "current" ? "step" : undefined}
              style={styles.row}
            >
              <View style={styles.rail}>
                <StepNode
                  index={index}
                  status={status}
                  palette={palette}
                  reduceMotion={reduceMotion}
                />
                {last ? null : (
                  <Connector
                    filled={index < current}
                    vertical
                    palette={palette}
                    reduceMotion={reduceMotion}
                  />
                )}
              </View>
              <View style={[styles.copy, last ? undefined : styles.copyGap]}>
                <Text style={[styles.title, { color: titleColor }]}>{step.title}</Text>
                {step.description ? (
                  <Text style={[styles.description, { color: palette.mutedText }]}>
                    {step.description}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }

        return (
          <View key={step.id} style={[styles.horizontalItem, last && styles.horizontalLast]}>
            <View
              role="listitem"
              accessible
              accessibilityLabel={labelOf(step, index, status)}
              aria-current={status === "current" ? "step" : undefined}
              style={styles.column}
            >
              <StepNode
                index={index}
                status={status}
                palette={palette}
                reduceMotion={reduceMotion}
              />
              <Text style={[styles.columnTitle, { color: titleColor }]} numberOfLines={2}>
                {step.title}
              </Text>
            </View>
            {last ? null : (
              <Connector
                filled={index < current}
                vertical={false}
                palette={palette}
                reduceMotion={reduceMotion}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

function StepNode({
  index,
  status,
  palette,
  reduceMotion,
}: {
  index: number;
  status: Status;
  palette: StepTrackerColors;
  reduceMotion: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  // 1 means the ring is fully faded, which is where it rests unless this is the current step.
  const pulse = useRef(new Animated.Value(1)).current;
  const wasComplete = useRef(status === "complete");

  useEffect(() => {
    const complete = status === "complete";
    if (complete && !wasComplete.current && !reduceMotion) {
      scale.setValue(0.55);
      Animated.spring(scale, {
        toValue: 1,
        stiffness: 420,
        damping: 13,
        mass: 1,
        useNativeDriver: NATIVE_DRIVER,
      }).start();
    }
    wasComplete.current = complete;
  }, [status, reduceMotion, scale]);

  useEffect(() => {
    if (status !== "current" || reduceMotion) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: NATIVE_DRIVER }),
    );
    loop.start();
    return () => loop.stop();
  }, [status, reduceMotion, pulse]);

  const ringStyle = useMemo(
    () => ({
      transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
    }),
    [pulse],
  );
  const nodeStyle = useMemo(() => ({ transform: [{ scale }] }), [scale]);

  const filled = status !== "upcoming";
  const fill = status === "complete" ? palette.complete : palette.current;

  return (
    <View style={styles.nodeWrap}>
      <Animated.View
        pointerEvents="none"
        style={[styles.ring, { borderColor: palette.current }, ringStyle]}
      />
      <Animated.View
        style={[
          styles.node,
          filled
            ? { backgroundColor: fill, borderColor: fill }
            : { backgroundColor: "transparent", borderColor: palette.upcoming },
          nodeStyle,
        ]}
      >
        <Text style={[styles.nodeText, { color: filled ? "#ffffff" : palette.mutedText }]}>
          {status === "complete" ? "✓" : index + 1}
        </Text>
      </Animated.View>
    </View>
  );
}

function Connector({
  filled,
  vertical,
  palette,
  reduceMotion,
}: {
  filled: boolean;
  vertical: boolean;
  palette: StepTrackerColors;
  reduceMotion: boolean;
}) {
  const progress = useRef(new Animated.Value(filled ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(filled ? 1 : 0);
      return;
    }
    // Size is layout, so this runs on the JS driver.
    Animated.timing(progress, {
      toValue: filled ? 1 : 0,
      duration: 420,
      useNativeDriver: false,
    }).start();
  }, [filled, reduceMotion, progress]);

  const fillStyle = useMemo(() => {
    const size = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
    return vertical
      ? { width: "100%" as const, height: size }
      : { height: "100%" as const, width: size };
  }, [progress, vertical]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        vertical ? styles.trackVertical : styles.trackHorizontal,
        { backgroundColor: palette.line },
      ]}
    >
      <Animated.View style={[fillStyle, { backgroundColor: palette.complete }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  horizontal: { flexDirection: "row", alignItems: "flex-start" },
  horizontalItem: { flexDirection: "row", flex: 1, alignItems: "flex-start" },
  // The last column has no connector, so it takes only its own width and the others share the rest.
  horizontalLast: { flex: 0 },
  row: { flexDirection: "row", gap: 14 },
  rail: { alignItems: "center", width: NODE },
  copy: { flex: 1, paddingTop: 5 },
  copyGap: { paddingBottom: 22 },
  title: { fontSize: 16, fontWeight: "600" },
  description: { marginTop: 2, fontSize: 13, lineHeight: 18 },
  column: { width: COLUMN, alignItems: "center", gap: 8 },
  columnTitle: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  nodeWrap: { width: NODE, height: NODE, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    top: 0,
    left: 0,
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2,
  },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeText: { fontSize: 14, fontWeight: "700" },
  trackVertical: {
    width: 2,
    flex: 1,
    minHeight: 14,
    marginVertical: 4,
    borderRadius: 1,
    overflow: "hidden",
  },
  trackHorizontal: {
    flex: 1,
    minWidth: 8,
    height: 2,
    marginTop: NODE / 2 - 1,
    borderRadius: 1,
    overflow: "hidden",
  },
});
