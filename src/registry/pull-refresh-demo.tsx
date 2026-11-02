"use client";

import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { PullRefresh } from "./pull-refresh";
import { NativeStage } from "./native-stage";

const HEADLINES = [
  "Harbor ferry adds a Sunday timetable",
  "New bike lanes open on Barrington",
  "Library extends weekend hours",
  "Farmers market moves indoors for winter",
  "Tide chart: king tide on Thursday",
  "Council approves the waterfront plan",
  "Street art trail opens in the north end",
];

export function PullRefreshDemo() {
  const [items, setItems] = useState(HEADLINES.slice(0, 5));
  const [refreshing, setRefreshing] = useState(false);
  const [updated, setUpdated] = useState("Never");
  const count = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const refresh = () => {
    setRefreshing(true);
    timer.current = setTimeout(() => {
      count.current += 1;
      setItems((all) => [
        `Update ${count.current}: ${HEADLINES[(count.current + 4) % HEADLINES.length]}`,
        ...all,
      ]);
      setUpdated(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setRefreshing(false);
    }, 1300);
  };

  return (
    <NativeStage height={460}>
      {(c) => (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: c.foreground }}>Headlines</Text>
            <Text style={{ fontSize: 12, color: c.mutedForeground }}>
              Updated: {updated}. Pull down from the top.
            </Text>
          </View>
          <PullRefresh
            refreshing={refreshing}
            onRefresh={refresh}
            colors={{ indicator: c.primary, arrow: c.mutedForeground, background: c.background }}
          >
            {items.map((item, i) => (
              <View
                key={item}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  backgroundColor: c.background,
                  borderTopWidth: 1,
                  borderTopColor: c.border,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: i === 0 ? "700" : "500", color: c.foreground }}
                >
                  {item}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: c.mutedForeground }}>
                  {i + 1} min ago
                </Text>
              </View>
            ))}
          </PullRefresh>
        </View>
      )}
    </NativeStage>
  );
}

export default PullRefreshDemo;
