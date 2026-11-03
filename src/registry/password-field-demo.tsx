"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { PasswordField } from "./password-field";
import { NativeStage } from "./native-stage";

export function PasswordFieldDemo() {
  const [value, setValue] = useState("correct horse");

  return (
    <NativeStage height={260}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 14, padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Welcome back</Text>
          <PasswordField
            value={value}
            onChangeText={setValue}
            colors={{
              surface: c.card,
              border: c.border,
              focus: c.primary,
              text: c.foreground,
              placeholder: c.mutedForeground,
              toggle: c.primary,
            }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default PasswordFieldDemo;
