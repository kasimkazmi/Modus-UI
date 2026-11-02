"use client";

import { Text, View } from "react-native";
import { ParallaxHeader } from "./parallax-header";
import { NativeStage } from "./native-stage";

const STOPS = [
  { name: "Cabo da Roca", note: "Europe's westernmost point, 140 m above the sea", km: "3.2 km" },
  { name: "Praia do Guincho", note: "Wide dunes and steady Atlantic wind", km: "5.8 km" },
  { name: "Azenhas do Mar", note: "A village stacked down a cliff to a tidal pool", km: "4.1 km" },
  { name: "Sintra Ridge", note: "Forest paths between palaces and fog", km: "7.4 km" },
  { name: "Cascais Bay", note: "A flat promenade for the last easy stretch", km: "2.6 km" },
  { name: "Boca do Inferno", note: "Waves breaking into a collapsed sea cave", km: "1.9 km" },
  {
    name: "Farol de Santa Marta",
    note: "A white lighthouse with a small marine museum",
    km: "2.2 km",
  },
  { name: "Cidadela", note: "Sixteenth-century fort turned gallery quarter", km: "1.4 km" },
];

export function ParallaxHeaderDemo() {
  return (
    <NativeStage height={560}>
      {(c) => (
        <ParallaxHeader
          title="Coastal Trails"
          colors={{ background: c.background, bar: c.card, title: c.foreground, border: c.border }}
          header={
            <View
              style={{
                flex: 1,
                backgroundColor: `hsl(205 55% 48%)`,
                justifyContent: "flex-end",
                padding: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  letterSpacing: 1,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                PORTUGAL
              </Text>
              <Text style={{ fontSize: 34, fontWeight: "800", color: "#ffffff" }}>
                Coastal Trails
              </Text>
            </View>
          }
        >
          <View style={{ padding: 20, gap: 4 }}>
            <Text style={{ fontSize: 14, color: c.mutedForeground }}>
              Eight stops, 28 km. Scroll to collapse the header, or pull down at the top to stretch
              it.
            </Text>
            {STOPS.map((stop) => (
              <View
                key={stop.name}
                style={{
                  flexDirection: "row",
                  gap: 12,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: c.foreground }}>
                    {stop.name}
                  </Text>
                  <Text style={{ marginTop: 2, fontSize: 13, color: c.mutedForeground }}>
                    {stop.note}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: c.primary }}>{stop.km}</Text>
              </View>
            ))}
          </View>
        </ParallaxHeader>
      )}
    </NativeStage>
  );
}

export default ParallaxHeaderDemo;
