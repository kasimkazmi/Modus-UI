"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ExpandCard } from "./expand-card";
import { NativeStage } from "./native-stage";

const STAYS = [
  {
    id: "harbor",
    title: "Harbor Loft",
    subtitle: "Halifax, Nova Scotia",
    hue: 205,
    price: "$168 a night",
    note: "Top floor, harbour view, two minutes from the ferry.",
  },
  {
    id: "cedar",
    title: "Cedar Cabin",
    subtitle: "Cape Breton",
    hue: 140,
    price: "$124 a night",
    note: "Wood stove, a dock, and no signal on purpose.",
  },
  {
    id: "tide",
    title: "Tide House",
    subtitle: "Lunenburg",
    hue: 28,
    price: "$212 a night",
    note: "A restored captain's house with a walled garden.",
  },
];

export function ExpandCardDemo() {
  const [open, setOpen] = useState<string | null>("harbor");

  return (
    <NativeStage height={540}>
      {(c) => (
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: c.foreground }}>Stays</Text>
          {STAYS.map((stay) => (
            <ExpandCard
              key={stay.id}
              title={stay.title}
              subtitle={stay.subtitle}
              expanded={open === stay.id}
              onExpandedChange={(next) => setOpen(next ? stay.id : null)}
              collapsedHeight={80}
              expandedHeight={290}
              heroHeight={140}
              hero={
                <View
                  style={{
                    flex: 1,
                    alignSelf: "stretch",
                    backgroundColor: `hsl(${stay.hue} 55% 60%)`,
                  }}
                />
              }
              colors={{
                surface: c.card,
                border: c.border,
                title: c.foreground,
                subtitle: c.mutedForeground,
              }}
            >
              <Text style={{ fontSize: 14, lineHeight: 20, color: c.foreground }}>{stay.note}</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 12,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: c.foreground }}>
                  {stay.price}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Reserve ${stay.title}`}
                  onPress={() => {}}
                  style={({ pressed }) => ({
                    minHeight: 40,
                    paddingHorizontal: 18,
                    borderRadius: 999,
                    justifyContent: "center",
                    backgroundColor: c.primary,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: c.primaryForeground }}>
                    Reserve
                  </Text>
                </Pressable>
              </View>
            </ExpandCard>
          ))}
        </View>
      )}
    </NativeStage>
  );
}

export default ExpandCardDemo;
