"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BatteryMeter } from "./battery-meter";
import { NativeStage } from "./native-stage";

export function BatteryMeterDemo() {
  const [level, setLevel] = useState(0.64);
  const [charging, setCharging] = useState(false);

  return (
    <NativeStage height={320}>
      {(c) => {
        const chip = (label: string, onPress: () => void) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text style={{ color: c.foreground, fontWeight: "600" }}>{label}</Text>
          </Pressable>
        );
        return (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: 26,
              padding: 24,
            }}
          >
            <BatteryMeter
              level={level}
              charging={charging}
              width={120}
              colors={{ text: c.foreground }}
            />
            <View
              style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" }}
            >
              {chip("12%", () => setLevel(0.12))}
              {chip("64%", () => setLevel(0.64))}
              {chip("100%", () => setLevel(1))}
              {chip(charging ? "Unplug" : "Plug in", () => setCharging(!charging))}
            </View>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default BatteryMeterDemo;
