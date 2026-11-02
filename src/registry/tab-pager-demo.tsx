"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { TabPager } from "./tab-pager";
import { NativeStage } from "./native-stage";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "files", label: "Files" },
  { id: "members", label: "Members" },
  { id: "settings", label: "Settings" },
];

const COPY: Record<string, string[]> = {
  overview: [
    "Harbor Lofts redesign",
    "Due 14 November, 6 of 9 tasks done",
    "Next review on Thursday at 3pm",
  ],
  activity: [
    "Maya moved Hero to Review",
    "Leo commented on Pricing",
    "Ines uploaded three screenshots",
    "Build 412 passed",
  ],
  files: ["brand-guidelines.pdf", "hero-v3.fig", "pricing-copy.docx", "icons.zip"],
  members: [
    "Maya Chen, design lead",
    "Leo Park, engineer",
    "Ines Duarte, product",
    "Theo Okafor, research",
  ],
  settings: ["Notifications on", "Weekly digest on Mondays", "Two-step sign-in enabled"],
};

export function TabPagerDemo() {
  const [tab, setTab] = useState("overview");

  return (
    <NativeStage height={420}>
      {(c) => (
        <TabPager
          tabs={TABS}
          value={tab}
          onChange={setTab}
          colors={{
            text: c.mutedForeground,
            activeText: c.foreground,
            indicator: c.primary,
            border: c.border,
            background: c.background,
          }}
          renderPage={(item) => (
            <View style={{ padding: 20, gap: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: c.foreground }}>
                {item.label}
              </Text>
              {COPY[item.id].map((line) => (
                <View
                  key={line}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border }}
                >
                  <Text style={{ fontSize: 15, color: c.foreground }}>{line}</Text>
                </View>
              ))}
              <Text style={{ marginTop: 8, fontSize: 13, color: c.mutedForeground }}>
                Swipe, drag or tap a tab.
              </Text>
            </View>
          )}
        />
      )}
    </NativeStage>
  );
}

export default TabPagerDemo;
