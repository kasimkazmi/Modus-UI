"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { ResendButton } from "./resend-button";
import { NativeStage } from "./native-stage";

export function ResendButtonDemo() {
  const [sent, setSent] = useState(1);

  return (
    <NativeStage height={260}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 10, padding: 24 }}>
          <Text
            style={{ fontSize: 22, fontWeight: "700", textAlign: "center", color: c.foreground }}
          >
            Check your phone
          </Text>
          <Text style={{ textAlign: "center", color: c.mutedForeground }}>
            We sent code number {sent} to +1 555 0100.
          </Text>
          <ResendButton
            seconds={8}
            onResend={() => setSent(sent + 1)}
            colors={{ accent: c.primary, disabled: c.mutedForeground }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default ResendButtonDemo;
