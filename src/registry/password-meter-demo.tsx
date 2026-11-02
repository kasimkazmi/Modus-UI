"use client";

import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { PasswordMeter } from "./password-meter";
import { NativeStage } from "./native-stage";

export function PasswordMeterDemo() {
  const [value, setValue] = useState("hunter2");

  return (
    <NativeStage height={300}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 14, padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>
            Create password
          </Text>
          <TextInput
            accessibilityLabel="Password"
            value={value}
            onChangeText={setValue}
            placeholder="Type a password"
            placeholderTextColor={c.mutedForeground}
            style={{
              height: 48,
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.card,
              color: c.foreground,
              fontSize: 16,
            }}
          />
          <PasswordMeter value={value} colors={{ track: c.muted, text: c.mutedForeground }} />
          <Text style={{ fontSize: 13, color: c.mutedForeground }}>
            Use 12 or more characters with upper and lower case, numbers and symbols.
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default PasswordMeterDemo;
