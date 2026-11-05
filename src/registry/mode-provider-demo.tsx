"use client";

import { Pressable, Text, View } from "react-native";
import { ModeProvider, useMode, type Mode } from "./mode-provider";
import { NativeStage } from "./native-stage";

const MODES: Mode[] = ["light", "dark", "system"];

function Panel() {
  const { mode, scheme, setMode, toggle } = useMode();
  const dark = scheme === "dark";

  return (
    <NativeStage height={340}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 16, padding: 24 }}>
          <View
            style={{
              padding: 18,
              borderRadius: 18,
              gap: 4,
              backgroundColor: dark ? "#16161d" : "#f9fafb",
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text style={{ fontSize: 13, color: dark ? "#9ca3af" : "#6b7280" }}>useMode()</Text>
            <Text
              accessibilityLiveRegion="polite"
              style={{ fontSize: 20, fontWeight: "800", color: dark ? "#f9fafb" : "#111827" }}
            >
              mode: {mode} · scheme: {scheme}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {MODES.map((m) => (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityLabel={m}
                accessibilityState={{ checked: mode === m }}
                onPress={() => setMode(m)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  backgroundColor: mode === m ? c.primary : c.muted,
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    color: mode === m ? c.primaryForeground : c.foreground,
                  }}
                >
                  {m}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle"
            onPress={toggle}
            style={{
              alignSelf: "flex-start",
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text style={{ fontWeight: "600", color: c.foreground }}>toggle()</Text>
          </Pressable>
        </View>
      )}
    </NativeStage>
  );
}

export function ModeProviderDemo() {
  return (
    <ModeProvider initialMode="light">
      <Panel />
    </ModeProvider>
  );
}

export default ModeProviderDemo;
