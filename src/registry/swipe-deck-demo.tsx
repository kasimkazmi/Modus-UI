"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SwipeDeck } from "./swipe-deck";
import { NativeStage } from "./native-stage";

const PLACES = [
  { id: "lisbon", city: "Lisbon", note: "Trams, tiles and custard tarts", hue: 28 },
  { id: "kyoto", city: "Kyoto", note: "Temples at dawn, before the crowds", hue: 340 },
  { id: "reykjavik", city: "Reykjavik", note: "Hot pools under a pale midnight sun", hue: 205 },
  { id: "marrakech", city: "Marrakech", note: "Spice markets and rooftop sunsets", hue: 12 },
  { id: "oaxaca", city: "Oaxaca", note: "Mole, mezcal and market mornings", hue: 150 },
];

export function SwipeDeckDemo() {
  const [round, setRound] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);

  return (
    <NativeStage height={560}>
      {(c) => (
        <View style={{ flex: 1, padding: 20, gap: 16 }}>
          <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Next trip</Text>
          <SwipeDeck
            key={round}
            data={PLACES}
            keyExtractor={(place) => place.id}
            onSwipe={(place, direction) => {
              if (direction === "right") setSaved((all) => [...all, place.city]);
            }}
            colors={{ card: c.card, border: c.border }}
            rightLabel="Save"
            leftLabel="Skip"
            empty={
              <View style={{ alignItems: "center", gap: 14 }}>
                <Text style={{ fontSize: 16, color: c.mutedForeground }}>
                  {saved.length > 0 ? `Saved: ${saved.join(", ")}` : "Nothing saved"}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setSaved([]);
                    setRound((n) => n + 1);
                  }}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: c.primary,
                  }}
                >
                  <Text style={{ fontWeight: "600", color: c.primaryForeground }}>Start over</Text>
                </Pressable>
              </View>
            }
            renderCard={(place) => (
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: `hsl(${place.hue} 55% 62%)`,
                    justifyContent: "flex-end",
                    padding: 20,
                  }}
                >
                  <Text style={{ fontSize: 40, fontWeight: "800", color: "#ffffff" }}>
                    {place.city}
                  </Text>
                </View>
                <View style={{ padding: 20 }}>
                  <Text style={{ fontSize: 16, color: c.foreground }}>{place.note}</Text>
                </View>
              </View>
            )}
          />
          <Text style={{ textAlign: "center", fontSize: 13, color: c.mutedForeground }}>
            Drag right to save, left to skip
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default SwipeDeckDemo;
