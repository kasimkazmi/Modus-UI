"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { RatingHistogram } from "./rating-histogram";
import { NativeStage } from "./native-stage";

export function RatingHistogramDemo() {
  const [counts, setCounts] = useState<[number, number, number, number, number]>([2, 3, 8, 21, 46]);

  const add = (stars: number) =>
    setCounts((now) => now.map((n, i) => (i === stars - 1 ? n + 5 : n)) as typeof counts);

  return (
    <NativeStage height={320}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 20, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: c.foreground }}>
            Customer reviews
          </Text>
          <RatingHistogram
            counts={counts}
            colors={{ track: c.muted, text: c.mutedForeground, average: c.foreground }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[1, 3, 5].map((stars) => (
              <Pressable
                key={stars}
                accessibilityRole="button"
                accessibilityLabel={`Add five ${stars} star ratings`}
                onPress={() => add(stars)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Text style={{ color: c.foreground, fontWeight: "600" }}>+5 {stars}★</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default RatingHistogramDemo;
