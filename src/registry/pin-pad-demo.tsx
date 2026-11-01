"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { PinPad } from "./pin-pad";
import { NativeStage } from "./native-stage";

const PIN = "2580";

export function PinPadDemo() {
  const [round, setRound] = useState(0);
  const [unlocked, setUnlocked] = useState(false);

  return (
    <NativeStage height={560}>
      {(c) => (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}
        >
          <PinPad
            key={round}
            title={unlocked ? "Unlocked" : "Enter your PIN"}
            colors={{
              text: c.foreground,
              mutedText: c.mutedForeground,
              dot: c.mutedForeground,
              key: c.muted,
              keyText: c.foreground,
              error: c.destructive,
              success: c.primary,
            }}
            onComplete={async (pin) => {
              await new Promise((resolve) => setTimeout(resolve, 450));
              const ok = pin === PIN;
              setUnlocked(ok);
              return ok;
            }}
          />
          {unlocked ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setUnlocked(false);
                setRound((n) => n + 1);
              }}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: c.primary,
              }}
            >
              <Text style={{ fontWeight: "600", color: c.primaryForeground }}>Lock again</Text>
            </Pressable>
          ) : (
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>Hint: the PIN is {PIN}</Text>
          )}
        </View>
      )}
    </NativeStage>
  );
}

export default PinPadDemo;
