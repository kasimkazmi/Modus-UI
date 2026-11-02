"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { HuePicker } from "./hue-picker";
import { NativeStage } from "./native-stage";

/** Black or white, whichever reads better on the colour. */
function readableOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111827" : "#ffffff";
}

export function HuePickerDemo() {
  const [color, setColor] = useState("#4f46e5");

  return (
    <NativeStage height={520}>
      {(c) => (
        <View style={{ flex: 1, padding: 24, gap: 22 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: c.foreground }}>Brand color</Text>
          <View
            style={{
              borderRadius: 20,
              padding: 20,
              gap: 4,
              backgroundColor: color,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: readableOn(color) }}>
              Northwind Pay
            </Text>
            <Text style={{ fontSize: 13, color: readableOn(color), opacity: 0.85 }}>
              Your card, in {color}
            </Text>
          </View>
          <HuePicker
            value={color}
            onChange={setColor}
            colors={{ ring: c.foreground, text: c.foreground }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default HuePickerDemo;
