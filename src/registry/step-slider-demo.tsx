"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { StepSlider } from "./step-slider";
import { NativeStage } from "./native-stage";

const SIZES = ["XS", "S", "M", "L", "XL"];

export function StepSliderDemo() {
  const [index, setIndex] = useState(2);

  return (
    <NativeStage height={300}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 28, padding: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: c.mutedForeground }}>
            Text size
          </Text>
          <Text style={{ fontSize: 14 + index * 4, color: c.foreground }}>The quick brown fox</Text>
          <StepSlider
            steps={SIZES}
            value={index}
            onChange={setIndex}
            label="Text size"
            colors={{ track: c.muted, fill: c.primary, text: c.mutedForeground }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default StepSliderDemo;
