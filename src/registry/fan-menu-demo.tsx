"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { FanMenu } from "./fan-menu";
import { NativeStage } from "./native-stage";

export function FanMenuDemo() {
  const [last, setLast] = useState("Nothing yet");

  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1, padding: 24 }}>
          <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Notes</Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: c.mutedForeground }}>
            Last action: {last}
          </Text>
          <FanMenu
            style={{ position: "absolute", right: 28, bottom: 28 }}
            label="Add to notes"
            colors={{ button: c.primary, bar: c.primaryForeground, item: c.card }}
            items={[
              {
                label: "New note",
                icon: <Text style={{ fontSize: 20, color: c.foreground }}>✎</Text>,
                onPress: () => setLast("New note"),
              },
              {
                label: "Email",
                icon: <Text style={{ fontSize: 20, color: c.foreground }}>✉</Text>,
                onPress: () => setLast("Email"),
              },
              {
                label: "Favorite",
                icon: <Text style={{ fontSize: 20, color: c.foreground }}>★</Text>,
                onPress: () => setLast("Favorite"),
              },
              {
                label: "All notes",
                icon: <Text style={{ fontSize: 20, color: c.foreground }}>☰</Text>,
                onPress: () => setLast("All notes"),
              },
            ]}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default FanMenuDemo;
