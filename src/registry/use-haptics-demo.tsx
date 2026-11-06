"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useHaptics } from "./use-haptics.native";
import { NativeStage } from "./native-stage";

export function UseHapticsDemo() {
  const [enabled, setEnabled] = useState(true);
  const [last, setLast] = useState("Nothing yet");
  const haptics = useHaptics(enabled);

  return (
    <NativeStage height={340}>
      {(c) => {
        const button = (name: "tap" | "success" | "warning" | "error") => (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityLabel={`Fire ${name}`}
            onPress={() => {
              haptics[name]();
              setLast(enabled ? name : `${name} (off)`);
            }}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: c.primary,
            }}
          >
            <Text style={{ fontWeight: "700", color: c.primaryForeground }}>{name}</Text>
          </Pressable>
        );
        return (
          <View style={{ flex: 1, justifyContent: "center", gap: 18, padding: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Haptics</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {(["tap", "success", "warning", "error"] as const).map(button)}
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Haptics enabled"
              accessibilityState={{ checked: enabled }}
              onPress={() => setEnabled(!enabled)}
              style={{
                alignSelf: "flex-start",
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <Text style={{ color: c.foreground, fontWeight: "600" }}>
                Enabled: {enabled ? "on" : "off"}
              </Text>
            </Pressable>
            <Text
              accessibilityLiveRegion="polite"
              style={{ fontSize: 14, color: c.mutedForeground }}
            >
              Last fired: {last}. You will feel it on a phone.
            </Text>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default UseHapticsDemo;
