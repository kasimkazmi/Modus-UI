"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { SelectMenu } from "./select-menu";
import { NativeStage } from "./native-stage";

const COUNTRIES = [
  { value: "ca", label: "Canada" },
  { value: "us", label: "United States" },
  { value: "mx", label: "Mexico" },
  { value: "uk", label: "United Kingdom" },
];

export function SelectMenuDemo() {
  const [country, setCountry] = useState("");

  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1, padding: 24, gap: 14, justifyContent: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Shipping to</Text>
          <SelectMenu
            label="Country"
            options={COUNTRIES}
            value={country}
            onChange={setCountry}
            colors={{
              surface: c.card,
              border: c.border,
              text: c.foreground,
              placeholder: c.mutedForeground,
              selected: c.muted,
              accent: c.primary,
            }}
          />
          <Text style={{ fontSize: 14, color: c.mutedForeground }}>
            This text moves down when the list opens.
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default SelectMenuDemo;
