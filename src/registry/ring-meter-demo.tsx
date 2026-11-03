"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { RingMeter } from "./ring-meter";
import { NativeStage } from "./native-stage";

export function RingMeterDemo() {
  const [steps, setSteps] = useState(0.74);

  return (
    <NativeStage height={440}>
      {(c) => {
        const button = (label: string, delta: number) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() =>
              setSteps((v) => Math.max(0, Math.min(1, Math.round((v + delta) * 100) / 100)))
            }
            style={({ pressed }) => ({
              minHeight: 44,
              minWidth: 72,
              paddingHorizontal: 16,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: c.muted,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: c.foreground }}>{label}</Text>
          </Pressable>
        );
        return (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 26,
              padding: 24,
            }}
          >
            <RingMeter
              value={steps}
              size={180}
              thickness={16}
              label="Daily steps"
              colors={{ track: c.muted, fill: c.primary, text: c.foreground }}
            >
              <Text style={{ fontSize: 34, fontWeight: "800", color: c.foreground }}>
                {Math.round(steps * 10000).toLocaleString()}
              </Text>
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>of 10,000 steps</Text>
            </RingMeter>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {button("-10%", -0.1)}
              {button("+10%", 0.1)}
              {button("Full", 1)}
            </View>
            <View style={{ flexDirection: "row", gap: 22 }}>
              <RingMeter
                value={0.32}
                size={72}
                thickness={8}
                label="Sleep"
                colors={{ track: c.muted, fill: c.destructive, text: c.foreground }}
              />
              <RingMeter
                value={0.58}
                size={72}
                thickness={8}
                label="Water"
                colors={{ track: c.muted, fill: c.primary, text: c.foreground }}
              />
              <RingMeter
                value={1}
                size={72}
                thickness={8}
                label="Calories"
                colors={{ track: c.muted, fill: c.foreground, text: c.foreground }}
              />
            </View>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default RingMeterDemo;
