"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { BubbleTabBar } from "./bubble-tab-bar";
import { NativeStage } from "./native-stage";

const glyph = (char: string) => {
  const Icon = (color: string) => <Text style={{ fontSize: 20, color }}>{char}</Text>;
  return Icon;
};

const TABS = [
  { id: "home", label: "Home", icon: glyph("⌂") },
  { id: "saved", label: "Saved", icon: glyph("♡") },
  { id: "search", label: "Search", icon: glyph("⌕") },
  { id: "profile", label: "Profile", icon: glyph("☺") },
];

const SCREENS: Record<string, string> = {
  home: "Your feed is up to date.",
  saved: "12 places saved for later.",
  search: "Find a trail, a cafe or a person.",
  profile: "Sam Okafor, member since 2024.",
};

export function BubbleTabBarDemo() {
  const [tab, setTab] = useState("home");
  const title = TABS.find((item) => item.id === tab)?.label;

  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "space-between", padding: 20 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 28, fontWeight: "700", color: c.foreground }}>{title}</Text>
            <Text style={{ fontSize: 15, color: c.mutedForeground }}>{SCREENS[tab]}</Text>
          </View>
          <BubbleTabBar
            tabs={TABS}
            value={tab}
            onChange={setTab}
            colors={{
              bar: c.card,
              pill: c.primary,
              active: c.primaryForeground,
              inactive: c.mutedForeground,
            }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default BubbleTabBarDemo;
