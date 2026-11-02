"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ActionTray } from "./action-tray";
import { NativeStage } from "./native-stage";

export function ActionTrayDemo() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState("Nothing yet");

  return (
    <NativeStage height={520}>
      {(c) => (
        <View style={{ flex: 1, padding: 20, gap: 16 }}>
          <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Photos</Text>
          <View
            style={{
              height: 260,
              borderRadius: 20,
              backgroundColor: "hsl(205 55% 52%)",
              justifyContent: "flex-end",
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#ffffff" }}>IMG_2041</Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
              Halifax harbour, 6:42 PM
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen(true)}
            style={({ pressed }) => ({
              alignSelf: "flex-start",
              paddingHorizontal: 22,
              paddingVertical: 12,
              borderRadius: 999,
              backgroundColor: c.primary,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: c.primaryForeground }}>
              Options
            </Text>
          </Pressable>
          <Text style={{ fontSize: 14, color: c.mutedForeground }}>Last action: {last}</Text>
          <ActionTray
            open={open}
            onClose={() => setOpen(false)}
            title="IMG_2041"
            message="Choose what to do with this photo"
            colors={{
              surface: c.card,
              text: c.foreground,
              mutedText: c.mutedForeground,
              destructive: c.destructive,
              divider: c.border,
              handle: c.border,
            }}
            actions={[
              { label: "Share", onPress: () => setLast("Share") },
              { label: "Copy link", onPress: () => setLast("Copy link") },
              { label: "Add to album", onPress: () => setLast("Add to album") },
              { label: "Download (offline)", onPress: () => setLast("Download"), disabled: true },
              { label: "Delete photo", onPress: () => setLast("Delete photo"), destructive: true },
            ]}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default ActionTrayDemo;
