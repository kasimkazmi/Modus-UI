"use client";

import { Text, View } from "react-native";
import { CompareSlider } from "./compare-slider";
import { NativeStage } from "./native-stage";

const panel = (bg: string, title: string, note: string) => (
  <View style={{ flex: 1, backgroundColor: bg, padding: 18, justifyContent: "flex-end" }}>
    <Text style={{ fontSize: 22, fontWeight: "800", color: "#ffffff" }}>{title}</Text>
    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{note}</Text>
  </View>
);

export function CompareSliderDemo() {
  return (
    <NativeStage height={320}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 14, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: c.foreground }}>
            Redesign preview
          </Text>
          <CompareSlider
            label="Before and after"
            before={panel("#64748b", "Before", "Cramped rows, no hierarchy")}
            after={panel("#4f46e5", "After", "Calm spacing, clear actions")}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default CompareSliderDemo;
