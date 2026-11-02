"use client";

import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StripeProgress } from "./stripe-progress";
import { NativeStage } from "./native-stage";

export function StripeProgressDemo() {
  const [upload, setUpload] = useState(0.18);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setUpload((value) => {
        if (value >= 1) {
          setRunning(false);
          return 1;
        }
        return Math.min(1, value + 0.07);
      });
    }, 700);
    return () => clearInterval(id);
  }, [running]);

  return (
    <NativeStage height={400}>
      {(c) => {
        const colors = { track: c.muted, fill: c.primary, text: c.foreground };
        const row = (title: string, detail: string, bar: React.ReactNode) => (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: c.foreground }}>{title}</Text>
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>{detail}</Text>
            </View>
            {bar}
          </View>
        );
        return (
          <View style={{ flex: 1, justifyContent: "center", gap: 28, padding: 24 }}>
            {row(
              "Uploading photos",
              upload >= 1 ? "Done" : "148 of 212",
              <StripeProgress
                label="Uploading photos"
                value={upload}
                height={12}
                showPercent
                colors={colors}
              />,
            )}
            {row(
              "Syncing library",
              "Working",
              <StripeProgress label="Syncing library" height={12} colors={colors} />,
            )}
            {row(
              "Storage used",
              "7.2 of 10 GB",
              <StripeProgress
                label="Storage used"
                value={0.72}
                striped={false}
                height={8}
                showPercent
                colors={colors}
              />,
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setUpload(0.05);
                setRunning(true);
              }}
              style={({ pressed }) => ({
                alignSelf: "flex-start",
                minHeight: 44,
                paddingHorizontal: 20,
                borderRadius: 999,
                justifyContent: "center",
                backgroundColor: c.muted,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>
                Restart upload
              </Text>
            </Pressable>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default StripeProgressDemo;
