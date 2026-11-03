"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { SwatchPicker } from "./swatch-picker";
import { NativeStage } from "./native-stage";

const OPTIONS = [
  { value: "#ef4444", label: "Red" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#10b981", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
];

export function SwatchPickerDemo() {
  const [value, setValue] = useState("#3b82f6");
  const name = OPTIONS.find((o) => o.value === value)?.label;

  return (
    <NativeStage height={260}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 18, padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Label colour</Text>
          <View
            style={{
              height: 56,
              borderRadius: 14,
              backgroundColor: value,
              justifyContent: "center",
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "700" }}>{name}</Text>
          </View>
          <SwatchPicker
            options={OPTIONS}
            value={value}
            onChange={setValue}
            colors={{ ring: c.foreground }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default SwatchPickerDemo;
