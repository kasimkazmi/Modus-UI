"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TipPopover } from "./tip-popover";
import { NativeStage } from "./native-stage";

export function TipPopoverDemo() {
  const [open, setOpen] = useState<"share" | "sync" | null>(null);

  return (
    <NativeStage height={340}>
      {(c) => {
        const button = (id: "share" | "sync", label: string) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => setOpen(open === id ? null : id)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 18,
              borderRadius: 12,
              backgroundColor: c.primary,
            }}
          >
            <Text style={{ fontWeight: "600", color: c.primaryForeground }}>{label}</Text>
          </Pressable>
        );
        return (
          <View
            style={{ flex: 1, justifyContent: "space-around", alignItems: "center", padding: 24 }}
          >
            <TipPopover
              open={open === "share"}
              onClose={() => setOpen(null)}
              content="Anyone with the link can view this file."
            >
              {button("share", "Share")}
            </TipPopover>
            <TipPopover
              open={open === "sync"}
              onClose={() => setOpen(null)}
              placement="bottom"
              content="Changes sync across your devices."
            >
              {button("sync", "Sync")}
            </TipPopover>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default TipPopoverDemo;
