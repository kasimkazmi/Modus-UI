"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { MoodPicker } from "./mood-picker";
import { NativeStage } from "./native-stage";

export function MoodPickerDemo() {
  const [mood, setMood] = useState<number | null>(null);

  return (
    <NativeStage height={280}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 28, padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>
            How was your ride?
          </Text>
          <MoodPicker
            value={mood}
            onChange={setMood}
            colors={{ accent: c.muted, surface: c.card, text: c.foreground }}
          />
          <Text accessibilityLiveRegion="polite" style={{ fontSize: 14, color: c.mutedForeground }}>
            {mood === null ? "Tap a face" : "Thanks for the feedback"}
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default MoodPickerDemo;
