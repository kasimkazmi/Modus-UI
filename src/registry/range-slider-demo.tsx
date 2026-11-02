"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { RangeSlider } from "./range-slider";
import { NativeStage } from "./native-stage";

const money = (value: number) => `$${value}`;

export function RangeSliderDemo() {
  const [price, setPrice] = useState<[number, number]>([120, 340]);
  const [age, setAge] = useState<[number, number]>([25, 40]);

  return (
    <NativeStage height={420}>
      {(c) => {
        const colors = {
          track: c.muted,
          fill: c.primary,
          thumb: c.card,
          bubble: c.foreground,
          bubbleText: c.background,
        };
        return (
          <View style={{ flex: 1, justifyContent: "center", gap: 30, paddingHorizontal: 28 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>
                Find a stay
              </Text>
              <Text
                accessibilityLiveRegion="polite"
                style={{ fontSize: 14, color: c.mutedForeground }}
              >
                {money(price[0])} to {money(price[1])} a night, ages {age[0]} to {age[1]}
              </Text>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: c.foreground }}>
                Price per night
              </Text>
              <RangeSlider
                label="Price"
                value={price}
                onValueChange={setPrice}
                min={0}
                max={500}
                step={5}
                minGap={20}
                format={money}
                colors={colors}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: c.foreground }}>
                Guest age
              </Text>
              <RangeSlider
                label="Age"
                value={age}
                onValueChange={setAge}
                min={18}
                max={80}
                minGap={5}
                colors={colors}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: c.mutedForeground }}>
                Locked
              </Text>
              <RangeSlider
                label="Locked"
                value={[20, 60]}
                onValueChange={() => {}}
                disabled
                colors={colors}
              />
            </View>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default RangeSliderDemo;
