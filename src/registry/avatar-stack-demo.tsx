"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { AvatarStack } from "./avatar-stack";
import { NativeStage } from "./native-stage";

const TEAM = [
  { id: "maya", name: "Maya Chen" },
  { id: "leo", name: "Leo Park" },
  { id: "ines", name: "Ines Duarte" },
  { id: "theo", name: "Theo Okafor" },
  { id: "nadia", name: "Nadia Rahman" },
  { id: "omar", name: "Omar Haddad" },
  { id: "june", name: "June Kowalski" },
];

export function AvatarStackDemo() {
  const [picked, setPicked] = useState("Press an avatar once the stack is open");

  return (
    <NativeStage height={400}>
      {(c) => {
        const colors = { ring: c.background, plus: c.mutedForeground };
        return (
          <View style={{ flex: 1, justifyContent: "center", gap: 26, padding: 24 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>
                Harbor Lofts
              </Text>
              <Text style={{ fontSize: 14, color: c.mutedForeground }}>
                7 people on this project
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  letterSpacing: 0.6,
                  color: c.mutedForeground,
                }}
              >
                TEAM
              </Text>
              <AvatarStack
                people={TEAM}
                max={4}
                colors={colors}
                onPersonPress={(person) => setPicked(person.name)}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  letterSpacing: 0.6,
                  color: c.mutedForeground,
                }}
              >
                REVIEWERS
              </Text>
              <AvatarStack
                people={TEAM.slice(0, 3)}
                size={32}
                overlap={10}
                expandOnPress={false}
                colors={colors}
              />
            </View>
            <Text accessibilityLiveRegion="polite" style={{ fontSize: 14, color: c.foreground }}>
              {picked}
            </Text>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default AvatarStackDemo;
