"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { ContactIndex } from "./contact-index";
import { NativeStage } from "./native-stage";

const NAMES = [
  "Aaliyah",
  "Aaron",
  "Ben",
  "Bianca",
  "Carlos",
  "Chloe",
  "Dana",
  "David",
  "Elena",
  "Eli",
  "Farah",
  "Felix",
  "Grace",
  "Hugo",
  "Ines",
  "Jack",
  "Kara",
  "Liam",
  "Maya",
  "Noah",
  "Omar",
  "Priya",
  "Quinn",
  "Rosa",
  "Sam",
  "Tara",
  "Uma",
  "Victor",
  "Wen",
  "Zoe",
];

export function ContactIndexDemo() {
  const [picked, setPicked] = useState("Pick someone");

  return (
    <NativeStage height={480}>
      {(c) => (
        <View style={{ flex: 1 }}>
          <View style={{ padding: 16 }}>
            <Text
              accessibilityLiveRegion="polite"
              style={{ fontSize: 18, fontWeight: "700", color: c.foreground }}
            >
              {picked}
            </Text>
          </View>
          <ContactIndex
            items={NAMES.map((name) => ({ id: name, name }))}
            onSelect={(item) => setPicked(item.name)}
            colors={{
              header: c.muted,
              headerText: c.mutedForeground,
              text: c.foreground,
              accent: c.primary,
              border: c.border,
            }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default ContactIndexDemo;
