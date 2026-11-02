"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { HoldStepper } from "./hold-stepper";
import { NativeStage } from "./native-stage";

const PRICE = 12.5;

export function HoldStepperDemo() {
  const [portions, setPortions] = useState(2);
  const [guests, setGuests] = useState(4);
  const [volume, setVolume] = useState(30);

  return (
    <NativeStage height={420}>
      {(c) => {
        const colors = { button: c.muted, glyph: c.foreground, text: c.foreground };
        return (
          <View style={{ flex: 1, padding: 20, gap: 22 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Dinner</Text>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>Portions</Text>
              <HoldStepper
                label="portions"
                max={30}
                value={portions}
                onChange={setPortions}
                colors={colors}
              />
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                Total ${(portions * PRICE).toFixed(2)}
              </Text>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>
                Guests (1 to 12)
              </Text>
              <HoldStepper
                label="guests"
                min={1}
                max={12}
                value={guests}
                onChange={setGuests}
                colors={colors}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>
                Music volume (steps of 5)
              </Text>
              <HoldStepper
                label="volume"
                max={100}
                step={5}
                value={volume}
                onChange={setVolume}
                colors={colors}
              />
            </View>
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>
              Hold a button to repeat. It speeds up the longer you hold.
            </Text>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default HoldStepperDemo;
