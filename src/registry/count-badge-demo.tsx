"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CountBadge } from "./count-badge";
import { NativeStage } from "./native-stage";

export function CountBadgeDemo() {
  const [count, setCount] = useState(3);

  return (
    <NativeStage height={360}>
      {(c) => {
        const colors = { badge: c.destructive, text: "#ffffff", ring: c.background };
        const icon = (glyph: string) => (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: c.muted,
            }}
          >
            <Text style={{ fontSize: 22, color: c.foreground }}>{glyph}</Text>
          </View>
        );
        const button = (label: string, onPress: () => void) => (
          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => ({
              minHeight: 44,
              paddingHorizontal: 18,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: c.muted,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: c.foreground }}>{label}</Text>
          </Pressable>
        );
        return (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 28,
              padding: 24,
            }}
          >
            <View style={{ flexDirection: "row", gap: 32 }}>
              <CountBadge count={count} label="Messages" colors={colors}>
                {icon("✉")}
              </CountBadge>
              <CountBadge count={count} dot label="Alerts" colors={colors}>
                {icon("♪")}
              </CountBadge>
              <CountBadge count={count * 40} label="Updates" colors={colors}>
                {icon("★")}
              </CountBadge>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {button("-1", () => setCount((n) => Math.max(0, n - 1)))}
              {button("+1", () => setCount((n) => n + 1))}
              {button("Clear", () => setCount(0))}
            </View>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default CountBadgeDemo;
