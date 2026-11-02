"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { LongPressMenu } from "./long-press-menu";
import { NativeStage } from "./native-stage";

export function LongPressMenuDemo() {
  const [last, setLast] = useState("Nothing yet");

  return (
    <NativeStage height={440}>
      {(c) => (
        <View style={{ flex: 1, padding: 20, gap: 18 }}>
          <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Messages</Text>
          <Text style={{ fontSize: 13, color: c.mutedForeground }}>
            Press and hold a message. Last action: {last}
          </Text>
          <LongPressMenu
            colors={{
              menu: c.card,
              text: c.foreground,
              destructive: c.destructive,
              border: c.border,
            }}
            items={[
              { label: "Reply", onPress: () => setLast("Reply") },
              { label: "Copy", onPress: () => setLast("Copy") },
              { label: "Delete", destructive: true, onPress: () => setLast("Delete") },
            ]}
          >
            <View
              style={{
                width: 270,
                padding: 14,
                borderRadius: 18,
                borderTopLeftRadius: 4,
                backgroundColor: c.muted,
              }}
            >
              <Text style={{ fontSize: 16, color: c.foreground }}>
                Dinner at eight? I booked the corner table by the window.
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: c.mutedForeground }}>
                Maya, 6:42
              </Text>
            </View>
          </LongPressMenu>
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <LongPressMenu
              placement="above"
              colors={{
                menu: c.card,
                text: c.foreground,
                destructive: c.destructive,
                border: c.border,
              }}
              items={[
                { label: "Save photo", onPress: () => setLast("Save photo") },
                { label: "Share", onPress: () => setLast("Share") },
              ]}
            >
              <View
                style={{
                  width: 200,
                  height: 90,
                  borderRadius: 16,
                  backgroundColor: `hsl(205 55% 52%)`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#ffffff" }}>
                  Hold for options
                </Text>
              </View>
            </LongPressMenu>
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default LongPressMenuDemo;
