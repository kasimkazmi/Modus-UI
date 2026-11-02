"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { RollNumber } from "./roll-number";
import { NativeStage } from "./native-stage";

const START = 12480.62;

export function RollNumberDemo() {
  const [balance, setBalance] = useState(START);

  const actions = [
    { label: "+ $1,250.40", run: () => setBalance((v) => v + 1250.4) },
    { label: "- $87.15", run: () => setBalance((v) => v - 87.15) },
    { label: "x 10", run: () => setBalance((v) => v * 10) },
    { label: "Go negative", run: () => setBalance(-342.9) },
    { label: "Reset", run: () => setBalance(START) },
  ];

  return (
    <NativeStage height={360}>
      {(c) => (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 28, padding: 20 }}
        >
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>Available balance</Text>
            <RollNumber value={balance} decimals={2} prefix="$" colors={{ text: c.foreground }} />
          </View>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}
          >
            {actions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                onPress={action.run}
                style={({ pressed }) => ({
                  minHeight: 44,
                  justifyContent: "center",
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  backgroundColor: c.muted,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default RollNumberDemo;
