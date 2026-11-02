"use client";

import { Text, View } from "react-native";
import { MarqueeTicker } from "./marquee-ticker";
import { NativeStage, type StageColors } from "./native-stage";

const HEADLINES = [
  "Harbour ferry adds a late sailing",
  "Tide tables updated for November",
  "Lighthouse tours reopen on Saturday",
  "Fish market moves to the new pier",
];

const TAGS = ["ferries", "tides", "tours", "market", "weather", "events", "parking", "closures"];

function Dot({ c }: { c: StageColors }) {
  return (
    <View
      style={{ width: 5, height: 5, borderRadius: 3, marginLeft: 20, backgroundColor: c.primary }}
    />
  );
}

export function MarqueeTickerDemo() {
  return (
    <NativeStage height={340}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 28 }}>
          <View style={{ paddingHorizontal: 20, gap: 4 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>
              Harbour news
            </Text>
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>
              Press and hold a strip to pause it.
            </Text>
          </View>
          <View style={{ gap: 16 }}>
            <MarqueeTicker speed={70} gap={20} colors={{ background: c.muted }}>
              {HEADLINES.map((headline) => (
                <View key={headline} style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      paddingVertical: 12,
                      fontSize: 15,
                      fontWeight: "600",
                      color: c.foreground,
                    }}
                  >
                    {headline}
                  </Text>
                  <Dot c={c} />
                </View>
              ))}
            </MarqueeTicker>
            <MarqueeTicker direction="right" speed={38} gap={12}>
              {TAGS.map((tag) => (
                <View
                  key={tag}
                  style={{
                    marginRight: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                >
                  <Text style={{ fontSize: 13, color: c.mutedForeground }}>#{tag}</Text>
                </View>
              ))}
            </MarqueeTicker>
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default MarqueeTickerDemo;
