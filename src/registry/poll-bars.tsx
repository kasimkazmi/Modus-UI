import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface PollBarsColors {
  bar: string;
  chosenBar: string;
  surface: string;
  border: string;
  text: string;
}

const DEFAULT_COLORS: PollBarsColors = {
  bar: "#e0e7ff",
  chosenBar: "#a5b4fc",
  surface: "#ffffff",
  border: "#e5e7eb",
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

export interface PollBarsProps {
  options: PollOption[];
  /** The id the person voted for; once set, results show. */
  selected?: string;
  onVote: (id: string) => void;
  colors?: Partial<PollBarsColors>;
  style?: StyleProp<ViewStyle>;
}

function Row({
  option,
  share,
  chosen,
  voted,
  palette,
  reduceMotion,
  onVote,
}: {
  option: PollOption;
  share: number;
  chosen: boolean;
  voted: boolean;
  palette: PollBarsColors;
  reduceMotion: boolean;
  onVote: () => void;
}) {
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const toValue = voted ? share : 0;
    if (reduceMotion) fill.setValue(toValue);
    else
      Animated.timing(fill, {
        toValue,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
  }, [voted, share, reduceMotion, fill]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        voted
          ? `${option.label}, ${Math.round(share * 100)} percent${chosen ? ", your vote" : ""}`
          : option.label
      }
      accessibilityState={{ selected: chosen, disabled: voted }}
      disabled={voted}
      onPress={onVote}
      style={[
        styles.row,
        {
          borderColor: chosen ? palette.chosenBar : palette.border,
          backgroundColor: palette.surface,
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fill,
          {
            backgroundColor: chosen ? palette.chosenBar : palette.bar,
            width: fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          },
        ]}
      />
      <Text style={[styles.label, { color: palette.text }]}>
        {option.label}
        {chosen ? " ✓" : ""}
      </Text>
      {voted ? (
        <Text style={[styles.percent, { color: palette.text }]}>{Math.round(share * 100)}%</Text>
      ) : null}
    </Pressable>
  );
}

/**
 * A poll. Before anyone has voted each option is a button. After a vote the options turn into bars
 * that grow to each one's share of the votes, with percentages, and the chosen option is marked.
 * Results are read out for each option, along with which one is yours.
 */
export function PollBars({ options, selected, onVote, colors, style }: PollBarsProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const reduceMotion = useReduceMotion();
  const voted = selected !== undefined;
  const total = options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <View style={[styles.root, style]}>
      {options.map((option) => (
        <Row
          key={option.id}
          option={option}
          share={total ? option.votes / total : 0}
          chosen={option.id === selected}
          voted={voted}
          palette={palette}
          reduceMotion={reduceMotion}
          onVote={() => onVote(option.id)}
        />
      ))}
      <Text accessibilityLiveRegion="polite" style={[styles.total, { color: palette.text }]}>
        {voted ? `${total} votes` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  row: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 2,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    userSelect: "none",
  },
  fill: { position: "absolute", top: 0, bottom: 0, left: 0 },
  label: { fontSize: 16, fontWeight: "600" },
  percent: { fontSize: 15, fontWeight: "700" },
  total: { fontSize: 13, textAlign: "right", opacity: 0.7, minHeight: 18 },
});
