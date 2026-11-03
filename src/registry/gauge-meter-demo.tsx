"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { GaugeMeter } from "./gauge-meter";
import { NativeStage } from "./native-stage";

export function GaugeMeterDemo() {
  const [value, setValue] = useState(0.62);

  return (
    <NativeStage height={320}>
      {(c) => (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 24, padding: 24 }}
        >
          <GaugeMeter
            value={value}
            caption="Storage used"
            label="Storage used"
            colors={{
              track: c.muted,
              fill: c.primary,
              text: c.foreground,
              caption: c.mutedForeground,
            }}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[0.15, 0.62, 0.95].map((v) => (
              <Pressable
                key={v}
                accessibilityRole="button"
                accessibilityLabel={`Set to ${Math.round(v * 100)} percent`}
                onPress={() => setValue(v)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Text style={{ color: c.foreground, fontWeight: "600" }}>
                  {Math.round(v * 100)}%
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default GaugeMeterDemo;
