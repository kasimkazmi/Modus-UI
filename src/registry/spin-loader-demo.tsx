"use client";

import { Text, View } from "react-native";
import { SpinLoader, type SpinVariant } from "./spin-loader";
import { NativeStage } from "./native-stage";

const VARIANTS: { variant: SpinVariant; name: string }[] = [
  { variant: "ring", name: "Ring" },
  { variant: "dots", name: "Dots" },
  { variant: "bars", name: "Bars" },
  { variant: "pulse", name: "Pulse" },
];

export function SpinLoaderDemo() {
  return (
    <NativeStage height={380}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 28, padding: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {VARIANTS.map(({ variant, name }) => (
              <View key={variant} style={{ alignItems: "center", gap: 12 }}>
                <SpinLoader
                  variant={variant}
                  size={44}
                  label={`${name} loader`}
                  colors={{ color: c.primary, track: c.muted }}
                />
                <Text style={{ fontSize: 13, fontWeight: "600", color: c.mutedForeground }}>
                  {name}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ height: 1, backgroundColor: c.border }} />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderRadius: 14,
              backgroundColor: c.card,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <SpinLoader
              variant="ring"
              size={22}
              label="Syncing"
              colors={{ color: c.primary, track: c.muted }}
            />
            <Text style={{ fontSize: 15, color: c.foreground }}>Syncing your photos…</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <SpinLoader
              variant="dots"
              size={28}
              label="Typing"
              colors={{ color: c.mutedForeground }}
            />
            <Text style={{ fontSize: 14, color: c.mutedForeground }}>Maya is typing</Text>
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default SpinLoaderDemo;
