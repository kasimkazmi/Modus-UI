"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { WheelPicker } from "./wheel-picker";
import { NativeStage } from "./native-stage";

const HOURS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));
const MINUTES = Array.from({ length: 12 }, (_, i) => {
  const text = String(i * 5).padStart(2, "0");
  return { value: text, label: text };
});
const PERIODS = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

export function WheelPickerDemo() {
  const [hour, setHour] = useState("7");
  const [minute, setMinute] = useState("30");
  const [period, setPeriod] = useState("PM");

  return (
    <NativeStage height={380}>
      {(c) => {
        const colors = { text: c.mutedForeground, selectedText: c.foreground, highlight: c.muted };
        return (
          <View style={{ flex: 1, justifyContent: "center", gap: 22, paddingHorizontal: 24 }}>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>Alarm set for</Text>
              <Text style={{ fontSize: 34, fontWeight: "700", color: c.foreground }}>
                {hour}:{minute} {period}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <WheelPicker
                label="Hour"
                options={HOURS}
                value={hour}
                onChange={setHour}
                colors={colors}
                style={{ flex: 1 }}
              />
              <WheelPicker
                label="Minute"
                options={MINUTES}
                value={minute}
                onChange={setMinute}
                colors={colors}
                style={{ flex: 1 }}
              />
              <WheelPicker
                label="AM or PM"
                options={PERIODS}
                value={period}
                onChange={setPeriod}
                colors={colors}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default WheelPickerDemo;
