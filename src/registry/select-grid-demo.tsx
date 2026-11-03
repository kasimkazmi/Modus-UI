"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { SelectGrid } from "./select-grid";
import { NativeStage } from "./native-stage";

const TOPICS = [
  { id: "music", label: "Music", icon: "🎧" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "food", label: "Food", icon: "🍜" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "art", label: "Art", icon: "🎨" },
  { id: "tech", label: "Tech", icon: "💻" },
];

export function SelectGridDemo() {
  const [picked, setPicked] = useState<string[]>(["music"]);

  return (
    <NativeStage height={480}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 14, padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>
            Pick up to 3 interests
          </Text>
          <SelectGrid
            options={TOPICS}
            value={picked}
            onChange={setPicked}
            max={3}
            colors={{
              accent: c.primary,
              border: c.border,
              surface: c.card,
              selectedSurface: c.muted,
              label: c.foreground,
              checkText: c.primaryForeground,
            }}
          />
          <Text accessibilityLiveRegion="polite" style={{ fontSize: 14, color: c.mutedForeground }}>
            {picked.length} of 3 chosen
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default SelectGridDemo;
