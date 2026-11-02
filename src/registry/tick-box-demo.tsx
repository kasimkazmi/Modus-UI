"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { TickBox } from "./tick-box";
import { NativeStage } from "./native-stage";

const ITEMS = [
  { id: "wifi", label: "Wi-Fi", description: "Fast, free and everywhere" },
  { id: "parking", label: "Parking", description: "Two spaces on site" },
  { id: "pets", label: "Pets allowed", description: "Small dogs and cats" },
];

export function TickBoxDemo() {
  const [picked, setPicked] = useState<Record<string, boolean>>({
    wifi: true,
    parking: false,
    pets: false,
  });
  const [terms, setTerms] = useState(false);

  const count = ITEMS.filter((item) => picked[item.id]).length;
  const all: boolean | "mixed" = count === ITEMS.length ? true : count === 0 ? false : "mixed";

  return (
    <NativeStage height={420}>
      {(c) => {
        const colors = {
          border: c.mutedForeground,
          fill: c.primary,
          tick: c.primaryForeground,
          text: c.foreground,
          description: c.mutedForeground,
        };
        return (
          <View style={{ flex: 1, justifyContent: "center", gap: 6, paddingHorizontal: 28 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground, marginBottom: 6 }}>
              Amenities
            </Text>
            <TickBox
              label="Select all"
              checked={all}
              onChange={(next) =>
                setPicked(Object.fromEntries(ITEMS.map((item) => [item.id, next])))
              }
              colors={colors}
            />
            <View
              style={{
                marginLeft: 20,
                borderLeftWidth: 1,
                borderLeftColor: c.border,
                paddingLeft: 16,
              }}
            >
              {ITEMS.map((item) => (
                <TickBox
                  key={item.id}
                  label={item.label}
                  description={item.description}
                  checked={picked[item.id]}
                  onChange={(next) => setPicked((all) => ({ ...all, [item.id]: next }))}
                  colors={colors}
                />
              ))}
            </View>
            <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10 }} />
            <TickBox
              round
              label="I agree to the terms"
              checked={terms}
              onChange={setTerms}
              colors={colors}
            />
            <TickBox
              round
              label="Marketing emails"
              description="Not available in your region"
              checked={false}
              onChange={() => {}}
              disabled
              colors={colors}
            />
          </View>
        );
      }}
    </NativeStage>
  );
}

export default TickBoxDemo;
