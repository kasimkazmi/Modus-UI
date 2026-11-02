"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StepTracker } from "./step-tracker";
import { NativeStage, type StageColors } from "./native-stage";

const STEPS = [
  { id: "ordered", title: "Ordered", description: "Payment confirmed, order #4821" },
  { id: "packed", title: "Packed", description: "Boxed at the Halifax warehouse" },
  { id: "shipped", title: "Shipped", description: "Left the depot with Northwind Express" },
  { id: "delivered", title: "Delivered", description: "Signed for at the front door" },
];

function Button({
  label,
  onPress,
  disabled,
  c,
  primary,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  c: StageColors;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      aria-disabled={!!disabled}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: 20,
        borderRadius: 999,
        backgroundColor: primary ? c.primary : c.muted,
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ fontWeight: "600", color: primary ? c.primaryForeground : c.foreground }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function StepTrackerDemo() {
  const [current, setCurrent] = useState(1);
  const [vertical, setVertical] = useState(true);

  return (
    <NativeStage height={560}>
      {(c) => (
        <View style={{ flex: 1, padding: 20, gap: 20 }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Your order</Text>
            <Text style={{ fontSize: 14, color: c.mutedForeground }}>
              {current >= STEPS.length ? "Delivered" : `In progress: ${STEPS[current].title}`}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <StepTracker
              steps={STEPS.map((step) => (vertical ? step : { id: step.id, title: step.title }))}
              current={current}
              orientation={vertical ? "vertical" : "horizontal"}
              colors={{
                complete: c.primary,
                current: c.primary,
                upcoming: c.border,
                line: c.border,
                text: c.foreground,
                mutedText: c.mutedForeground,
              }}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Button
              c={c}
              label="Back"
              disabled={current <= 0}
              onPress={() => setCurrent((n) => Math.max(0, n - 1))}
            />
            <Button
              c={c}
              primary
              label="Next"
              disabled={current >= STEPS.length}
              onPress={() => setCurrent((n) => Math.min(STEPS.length, n + 1))}
            />
            <Button
              c={c}
              label={vertical ? "Horizontal" : "Vertical"}
              onPress={() => setVertical((v) => !v)}
            />
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default StepTrackerDemo;
