"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { SwipeActions } from "./swipe-actions";
import { NativeStage } from "./native-stage";

const INITIAL = [
  { id: 1, from: "Maya Chen", subject: "Design review moved to 3pm", time: "9:41" },
  { id: 2, from: "Northwind", subject: "Your invoice for October is ready", time: "9:12" },
  { id: 3, from: "Leo Park", subject: "Re: trip photos", time: "Yesterday" },
  { id: 4, from: "Calendar", subject: "Reminder: dentist, Thursday 10:30", time: "Yesterday" },
  { id: 5, from: "Ines Duarte", subject: "Can you look at the contract?", time: "Mon" },
];

export function SwipeActionsDemo() {
  const [rows, setRows] = useState(INITIAL);
  const [archived, setArchived] = useState(0);

  return (
    <NativeStage>
      {(c) => (
        <View style={{ flex: 1 }}>
          <Text
            style={{
              padding: 20,
              paddingBottom: 12,
              fontSize: 28,
              fontWeight: "700",
              color: c.foreground,
            }}
          >
            Inbox
          </Text>
          {rows.map((row) => (
            <SwipeActions
              key={row.id}
              colors={{ surface: c.background, action: c.primary, actionText: c.primaryForeground }}
              actions={[
                {
                  label: "Archive",
                  onPress: () => {
                    setRows((all) => all.filter((r) => r.id !== row.id));
                    setArchived((n) => n + 1);
                  },
                },
                {
                  label: "Delete",
                  color: c.destructive,
                  onPress: () => setRows((all) => all.filter((r) => r.id !== row.id)),
                },
              ]}
            >
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: c.foreground }}>
                    {row.from}
                  </Text>
                  <Text style={{ fontSize: 13, color: c.mutedForeground }}>{row.time}</Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{ marginTop: 2, fontSize: 14, color: c.mutedForeground }}
                >
                  {row.subject}
                </Text>
              </View>
            </SwipeActions>
          ))}
          <Text style={{ padding: 20, fontSize: 13, color: c.mutedForeground }}>
            {rows.length === 0
              ? "Inbox zero."
              : `Swipe a row left. ${archived > 0 ? `${archived} archived.` : ""}`}
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default SwipeActionsDemo;
