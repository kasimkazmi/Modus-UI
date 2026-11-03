"use client";

import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SettingList } from "./setting-list";
import { NativeStage } from "./native-stage";

export function SettingListDemo() {
  const [push, setPush] = useState(true);
  const [dark, setDark] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [last, setLast] = useState("Nothing tapped yet");

  return (
    <NativeStage height={520}>
      {(c) => {
        const colors = {
          surface: c.card,
          border: c.border,
          text: c.foreground,
          muted: c.mutedForeground,
          accent: c.primary,
          destructive: c.destructive,
          tile: c.muted,
          track: c.border,
        };
        const tile = (glyph: string) => (
          <Text style={{ fontSize: 16, color: c.foreground }}>{glyph}</Text>
        );
        return (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
            <Text style={{ fontSize: 26, fontWeight: "800", color: c.foreground }}>Settings</Text>
            <SettingList
              header="Account"
              colors={colors}
              items={[
                {
                  id: "profile",
                  label: "Profile",
                  icon: tile("☺"),
                  value: "Sam Okafor",
                  onPress: () => setLast("Opened Profile"),
                },
                {
                  id: "email",
                  label: "Email",
                  icon: tile("✉"),
                  kind: "value",
                  value: "sam@example.com",
                  onPress: () => setLast("Opened Email"),
                },
                { id: "plan", label: "Plan", icon: tile("★"), kind: "info", value: "Pro" },
              ]}
            />
            <SettingList
              header="Preferences"
              footer="Dark mode follows your device unless you change it here."
              colors={colors}
              items={[
                {
                  id: "push",
                  label: "Notifications",
                  description: "Messages and mentions",
                  icon: tile("♪"),
                  kind: "toggle",
                  checked: push,
                  onToggle: setPush,
                },
                {
                  id: "dark",
                  label: "Dark mode",
                  icon: tile("◐"),
                  kind: "toggle",
                  checked: dark,
                  onToggle: setDark,
                },
                {
                  id: "haptics",
                  label: "Haptics",
                  icon: tile("≋"),
                  kind: "toggle",
                  checked: haptics,
                  onToggle: setHaptics,
                },
                {
                  id: "beta",
                  label: "Early access",
                  kind: "toggle",
                  checked: false,
                  disabled: true,
                  description: "Invite only",
                },
              ]}
            />
            <SettingList
              colors={colors}
              items={[
                {
                  id: "out",
                  label: "Sign out",
                  destructive: true,
                  kind: "link",
                  onPress: () => setLast("Signed out"),
                },
              ]}
            />
            <View style={{ alignItems: "center" }}>
              <Text
                accessibilityLiveRegion="polite"
                style={{ fontSize: 13, color: c.mutedForeground }}
              >
                {last} · Notifications {push ? "on" : "off"}, dark {dark ? "on" : "off"}
              </Text>
            </View>
          </ScrollView>
        );
      }}
    </NativeStage>
  );
}

export default SettingListDemo;
