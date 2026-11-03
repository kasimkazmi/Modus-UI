"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { ModeToggle, type Mode } from "./mode-toggle";
import { NativeStage } from "./native-stage";

export function ModeToggleDemo() {
  const [mode, setMode] = useState<Mode>("light");
  const dark = mode === "dark";

  return (
    <NativeStage height={300}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 20, padding: 24 }}>
          <View
            style={{
              padding: 20,
              borderRadius: 20,
              gap: 6,
              backgroundColor: dark ? "#111827" : "#ffffff",
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: dark ? "#f9fafb" : "#111827" }}>
              {dark ? "Good evening" : "Good morning"}
            </Text>
            <Text style={{ fontSize: 14, color: dark ? "#9ca3af" : "#6b7280" }}>
              The card follows the switch below.
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <ModeToggle mode={mode} onChange={setMode} size="lg" />
            <Text style={{ fontSize: 15, color: c.mutedForeground }}>
              {dark ? "Dark" : "Light"}
            </Text>
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default ModeToggleDemo;
