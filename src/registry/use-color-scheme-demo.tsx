"use client";

import { Text, View } from "react-native";
import { useColorScheme } from "./use-color-scheme.native";
import { NativeStage } from "./native-stage";

function Readout() {
  const scheme = useColorScheme();
  return (
    <NativeStage height={260}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 14, padding: 24 }}>
          <Text style={{ fontSize: 14, color: c.mutedForeground }}>useColorScheme() returned</Text>
          <View
            style={{
              padding: 20,
              borderRadius: 18,
              backgroundColor: scheme === "dark" ? "#0b0b0f" : "#ffffff",
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text
              accessibilityLiveRegion="polite"
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: scheme === "dark" ? "#f9fafb" : "#111827",
              }}
            >
              {scheme}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: c.mutedForeground }}>
            It follows your device. Change your system appearance and the card flips.
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export function UseColorSchemeDemo() {
  return <Readout />;
}

export default UseColorSchemeDemo;
