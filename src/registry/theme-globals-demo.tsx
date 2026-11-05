"use client";

import { Text, View } from "react-native";
import { fontSize, fontWeight, radius, shadow, spacing } from "./theme-globals";
import { NativeStage } from "./native-stage";

export function ThemeGlobalsDemo() {
  return (
    <NativeStage height={520}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", padding: 18, gap: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: fontWeight.bold, color: c.foreground }}>
            Globals
          </Text>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, color: c.mutedForeground }}>spacing</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              {Object.entries(spacing).map(([name, value]) => (
                <View key={name} style={{ alignItems: "center", gap: 4 }}>
                  <View
                    style={{
                      width: value,
                      height: value,
                      backgroundColor: c.primary,
                      borderRadius: 2,
                    }}
                  />
                  <Text style={{ fontSize: 10, color: c.mutedForeground }}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, color: c.mutedForeground }}>radius</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {Object.entries(radius).map(([name, value]) => (
                <View
                  key={name}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: value,
                    backgroundColor: c.muted,
                    borderWidth: 1,
                    borderColor: c.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 10, color: c.mutedForeground }}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 12, color: c.mutedForeground }}>fontSize</Text>
            {Object.entries(fontSize).map(([name, style]) => (
              <Text key={name} numberOfLines={1} style={[style, { color: c.foreground }]}>
                {name}
              </Text>
            ))}
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, color: c.mutedForeground }}>shadow</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {Object.entries(shadow).map(([name, value]) => (
                <View
                  key={name}
                  style={{
                    width: 64,
                    height: 44,
                    borderRadius: radius.md,
                    backgroundColor: c.card,
                    boxShadow: value,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 11, color: c.foreground }}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default ThemeGlobalsDemo;
