"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { ValueSlider } from "./value-slider";
import { NativeStage } from "./native-stage";

export function ValueSliderDemo() {
  const [volume, setVolume] = useState(40);
  const [saved, setSaved] = useState<number | null>(null);
  const [temperature, setTemperature] = useState(21.5);

  return (
    <NativeStage height={440}>
      {(c) => {
        const colors = {
          track: c.muted,
          fill: c.primary,
          thumb: c.card,
          bubble: c.primary,
          bubbleText: c.primaryForeground,
        };
        return (
          <View style={{ flex: 1, padding: 24, gap: 26 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Settings</Text>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>Volume</Text>
              <ValueSlider
                label="Volume"
                value={volume}
                onValueChange={setVolume}
                onSlidingComplete={setSaved}
                colors={colors}
              />
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                {volume}%{saved === null ? "" : `, last saved at ${saved}%`}
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>
                Temperature (steps of 0.5)
              </Text>
              <ValueSlider
                label="Temperature"
                value={temperature}
                onValueChange={setTemperature}
                min={16}
                max={28}
                step={0.5}
                colors={colors}
              />
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>{temperature} °C</Text>
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>Locked</Text>
              <ValueSlider
                label="Locked"
                value={70}
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

export default ValueSliderDemo;
