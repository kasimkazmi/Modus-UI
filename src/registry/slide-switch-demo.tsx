"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { SlideSwitch } from "./slide-switch";
import { NativeStage } from "./native-stage";

const ROWS = [
  { id: "notifications", label: "Notifications", note: "Alerts for new messages" },
  { id: "sync", label: "Background sync", note: "Keep data fresh over Wi-Fi" },
  { id: "location", label: "Location", note: "Only while the app is open" },
  { id: "airplane", label: "Airplane mode", note: "Unavailable on this device", disabled: true },
];

export function SlideSwitchDemo() {
  const [on, setOn] = useState<Record<string, boolean>>({
    notifications: true,
    sync: false,
    location: true,
  });

  return (
    <NativeStage height={400}>
      {(c) => (
        <View style={{ flex: 1, paddingTop: 20 }}>
          <Text
            style={{
              paddingHorizontal: 20,
              paddingBottom: 12,
              fontSize: 26,
              fontWeight: "700",
              color: c.foreground,
            }}
          >
            Settings
          </Text>
          {ROWS.map((row) => (
            <View
              key={row.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: c.border,
              }}
            >
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: c.foreground }}>
                  {row.label}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 13, color: c.mutedForeground }}>
                  {row.note}
                </Text>
              </View>
              <SlideSwitch
                label={row.label}
                value={!!on[row.id]}
                disabled={row.disabled}
                onValueChange={(next) => setOn((all) => ({ ...all, [row.id]: next }))}
                colors={{ off: c.border, on: c.primary, thumb: c.card }}
              />
            </View>
          ))}
        </View>
      )}
    </NativeStage>
  );
}

export default SlideSwitchDemo;
