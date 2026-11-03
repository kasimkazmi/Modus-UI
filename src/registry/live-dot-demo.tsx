"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { LiveDot, type LiveStatus } from "./live-dot";
import { NativeStage } from "./native-stage";

const PEOPLE: { name: string; status: LiveStatus }[] = [
  { name: "Maya Chen", status: "online" },
  { name: "Leo Park", status: "away" },
  { name: "Ines Duarte", status: "busy" },
  { name: "Theo Okafor", status: "offline" },
];
const CYCLE: LiveStatus[] = ["online", "away", "busy", "offline"];

export function LiveDotDemo() {
  const [people, setPeople] = useState(PEOPLE);

  return (
    <NativeStage height={400}>
      {(c) => {
        const colors = { text: c.foreground };
        return (
          <View style={{ flex: 1, padding: 20, gap: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Team</Text>
              <LiveDot status="live" size={10} showLabel label="Live" colors={colors} />
            </View>
            {people.map((person, i) => (
              <Pressable
                key={person.name}
                accessibilityRole="button"
                accessibilityLabel={`${person.name}, ${person.status}. Press to change`}
                onPress={() =>
                  setPeople((all) =>
                    all.map((p, j) =>
                      j === i
                        ? { ...p, status: CYCLE[(CYCLE.indexOf(p.status) + 1) % CYCLE.length] }
                        : p,
                    ),
                  )
                }
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 52,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: pressed ? c.muted : c.card,
                  borderWidth: 1,
                  borderColor: c.border,
                })}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: c.foreground }}>
                  {person.name}
                </Text>
                <LiveDot status={person.status} showLabel size={11} colors={colors} />
              </Pressable>
            ))}
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>
              Press a person to change their status.
            </Text>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default LiveDotDemo;
