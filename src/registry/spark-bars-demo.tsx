"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SparkBars } from "./spark-bars";
import { NativeStage } from "./native-stage";

const WEEKS = [
  [12, 18, 9, 22, 30, 26, 34],
  [30, 24, 28, 14, 10, 16, 8],
];

export function SparkBarsDemo() {
  const [week, setWeek] = useState(0);
  const values = WEEKS[week];

  return (
    <NativeStage height={300}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
          <View
            style={{
              padding: 18,
              borderRadius: 18,
              gap: 14,
              backgroundColor: c.card,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>
              Steps this week (thousands)
            </Text>
            <Text style={{ fontSize: 30, fontWeight: "800", color: c.foreground }}>
              {values.reduce((a, b) => a + b, 0)}k
            </Text>
            <SparkBars
              values={values}
              height={64}
              label="Steps per day"
              colors={{ bar: c.muted, active: c.primary }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch week"
              onPress={() => setWeek(week ? 0 : 1)}
              style={{
                alignSelf: "flex-start",
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <Text style={{ color: c.foreground, fontWeight: "600" }}>Switch week</Text>
            </Pressable>
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default SparkBarsDemo;
