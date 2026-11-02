"use client";

import { Text, View } from "react-native";
import { TimelineList } from "./timeline-list";
import { NativeStage } from "./native-stage";

export function TimelineListDemo() {
  return (
    <NativeStage height={440}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 18, padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Order #1042</Text>
          <TimelineList
            colors={{
              line: c.border,
              current: c.primary,
              upcoming: c.border,
              title: c.foreground,
              description: c.mutedForeground,
            }}
            items={[
              {
                id: "1",
                title: "Order placed",
                description: "We got your order.",
                time: "9:02",
                status: "done",
              },
              {
                id: "2",
                title: "Packed",
                description: "Your items are boxed up.",
                time: "11:30",
                status: "done",
              },
              {
                id: "3",
                title: "Out for delivery",
                description: "The driver is on the way.",
                time: "Now",
                status: "current",
              },
              {
                id: "4",
                title: "Delivered",
                description: "Leave at the front door.",
                status: "upcoming",
              },
            ]}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default TimelineListDemo;
