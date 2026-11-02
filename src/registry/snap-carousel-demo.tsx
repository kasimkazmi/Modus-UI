"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { SnapCarousel } from "./snap-carousel";
import { NativeStage, type StageColors } from "./native-stage";

const STAYS = [
  { id: "ridge", name: "Ridge Cabin", place: "Banff, Alberta", price: "$214", hue: 205 },
  { id: "harbor", name: "Harbor Loft", place: "Halifax, Nova Scotia", price: "$168", hue: 172 },
  { id: "orchard", name: "Orchard House", place: "Niagara, Ontario", price: "$189", hue: 38 },
  { id: "dune", name: "Dune Studio", place: "Tofino, British Columbia", price: "$242", hue: 18 },
  { id: "lantern", name: "Lantern Flat", place: "Montreal, Quebec", price: "$151", hue: 330 },
];

function Stay({ stay, c }: { stay: (typeof STAYS)[number]; c: StageColors }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 200, backgroundColor: `hsl(${stay.hue} 52% 60%)` }} />
      <View style={{ padding: 16, gap: 4 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: c.foreground }}>{stay.name}</Text>
        <Text style={{ fontSize: 14, color: c.mutedForeground }}>{stay.place}</Text>
        <Text style={{ marginTop: 6, fontSize: 15, fontWeight: "600", color: c.foreground }}>
          {stay.price} <Text style={{ fontWeight: "400", color: c.mutedForeground }}>a night</Text>
        </Text>
      </View>
    </View>
  );
}

export function SnapCarouselDemo() {
  const [index, setIndex] = useState(0);

  return (
    <NativeStage height={520}>
      {(c) => (
        <View style={{ flex: 1, paddingTop: 20, gap: 14 }}>
          <View style={{ paddingHorizontal: 20, gap: 2 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Stays</Text>
            <Text style={{ fontSize: 14, color: c.mutedForeground }}>
              {index + 1} of {STAYS.length}: {STAYS[index].name}
            </Text>
          </View>
          <SnapCarousel
            data={STAYS}
            keyExtractor={(stay) => stay.id}
            itemWidth={0.72}
            onIndexChange={setIndex}
            colors={{ dot: c.border, activeDot: c.foreground }}
            renderItem={(stay) => <Stay stay={stay} c={c} />}
            style={{ flexShrink: 0 }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default SnapCarouselDemo;
