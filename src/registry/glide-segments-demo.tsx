"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { GlideSegments } from "./glide-segments";
import { NativeStage } from "./native-stage";

const RANGES = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const STEPS: Record<string, string> = {
  day: "8,420 steps",
  week: "61,930 steps",
  month: "248,115 steps",
  year: "2.9M steps",
};

export function GlideSegmentsDemo() {
  const [range, setRange] = useState("week");

  return (
    <NativeStage height={320}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 28, padding: 24 }}>
          <GlideSegments
            options={RANGES}
            value={range}
            onChange={setRange}
            colors={{
              track: c.muted,
              thumb: c.card,
              text: c.mutedForeground,
              selectedText: c.foreground,
            }}
          />
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>Activity this {range}</Text>
            <Text style={{ fontSize: 34, fontWeight: "700", color: c.foreground }}>
              {STEPS[range]}
            </Text>
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default GlideSegmentsDemo;
