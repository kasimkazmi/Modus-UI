"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { SuggestInput } from "./suggest-input";
import { NativeStage } from "./native-stage";

const CITIES = [
  "Lisbon",
  "Lima",
  "Lyon",
  "Kyoto",
  "Kraków",
  "Reykjavik",
  "Marrakech",
  "Oaxaca",
  "Osaka",
  "Porto",
  "Prague",
  "Seville",
  "Split",
  "Tallinn",
  "Valencia",
];

export function SuggestInputDemo() {
  const [text, setText] = useState("");
  const [picked, setPicked] = useState("Nowhere yet");

  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1, padding: 24, gap: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>
            Where to next?
          </Text>
          <SuggestInput
            label="Destination"
            placeholder="Search a city"
            value={text}
            onChangeText={setText}
            suggestions={CITIES}
            onSelect={(city) => {
              setText(city);
              setPicked(city);
            }}
            colors={{
              field: c.card,
              border: c.border,
              focusBorder: c.primary,
              text: c.foreground,
              placeholder: c.mutedForeground,
              panel: c.card,
              highlight: c.primary,
              activeRow: c.muted,
            }}
          />
          <View style={{ marginTop: 70, gap: 4 }}>
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>Destination</Text>
            <Text
              accessibilityLiveRegion="polite"
              style={{ fontSize: 18, fontWeight: "600", color: c.foreground }}
            >
              {picked}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: c.mutedForeground }}>
            Type a few letters, then tap a suggestion. On a keyboard, use the arrows and Enter.
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default SuggestInputDemo;
