"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SnapSheet } from "./snap-sheet";
import { NativeStage } from "./native-stage";

const STOPS = ["Peek", "Full"];

export function SnapSheetDemo() {
  const [open, setOpen] = useState(false);
  const [snap, setSnap] = useState(0);

  return (
    <NativeStage>
      {(c) => (
        <View style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: 24,
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>
              Order #4821
            </Text>
            <Text style={{ textAlign: "center", fontSize: 14, color: c.mutedForeground }}>
              Drag the handle to peek, expand, or dismiss.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(true)}
              style={({ pressed }) => ({
                marginTop: 8,
                paddingHorizontal: 22,
                paddingVertical: 12,
                borderRadius: 999,
                backgroundColor: c.primary,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: c.primaryForeground }}>
                Open sheet
              </Text>
            </Pressable>
          </View>
          <SnapSheet
            open={open}
            onClose={() => setOpen(false)}
            onSnapChange={setSnap}
            title="Delivery details"
            colors={{ surface: c.card, handle: c.border, title: c.foreground }}
          >
            <Text style={{ fontSize: 14, color: c.mutedForeground }}>
              Stop: {STOPS[snap] ?? STOPS[0]}
            </Text>
            {[
              "Courier: Northwind Express",
              "Arrives: Thursday, 2pm to 4pm",
              "Address: 14 Linden Street",
              "Signature required",
            ].map((line) => (
              <View
                key={line}
                style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border }}
              >
                <Text style={{ fontSize: 16, color: c.foreground }}>{line}</Text>
              </View>
            ))}
          </SnapSheet>
        </View>
      )}
    </NativeStage>
  );
}

export default SnapSheetDemo;
