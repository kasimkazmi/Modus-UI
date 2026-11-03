"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { ComposerBar } from "./composer-bar";
import { NativeStage } from "./native-stage";

export function ComposerBarDemo() {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState<string[]>(["Running ten minutes late"]);
  const [note, setNote] = useState("Type a message, press Enter to send");

  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: "flex-end", gap: 6, padding: 14 }}>
            {sent.slice(-4).map((message, i) => (
              <View
                key={`${i}-${message}`}
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "80%",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: c.primary,
                }}
              >
                <Text style={{ fontSize: 15, color: c.primaryForeground }}>{message}</Text>
              </View>
            ))}
            <Text
              accessibilityLiveRegion="polite"
              style={{ alignSelf: "center", marginTop: 8, fontSize: 12, color: c.mutedForeground }}
            >
              {note}
            </Text>
          </View>
          <ComposerBar
            value={value}
            onChangeText={setValue}
            onSend={(text) => {
              setSent((all) => [...all, text]);
              setNote(`Sent ${text.length} characters`);
            }}
            onAttach={() => setNote("Attachment menu would open")}
            onRecord={() => setNote("Voice recording would start")}
            colors={{
              background: c.background,
              field: c.muted,
              border: c.border,
              text: c.foreground,
              placeholder: c.mutedForeground,
              accent: c.primary,
              accentText: c.primaryForeground,
              icon: c.mutedForeground,
            }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default ComposerBarDemo;
