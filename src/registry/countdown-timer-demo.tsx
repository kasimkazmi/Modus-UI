"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CountdownTimer } from "./countdown-timer";
import { NativeStage } from "./native-stage";

export function CountdownTimerDemo() {
  const [running, setRunning] = useState(true);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);

  return (
    <NativeStage height={360}>
      {(c) => {
        const button = (label: string, onPress: () => void) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 12,
              backgroundColor: c.primary,
            }}
          >
            <Text style={{ fontWeight: "600", color: c.primaryForeground }}>{label}</Text>
          </Pressable>
        );
        return (
          <View style={{ flex: 1, justifyContent: "center", gap: 24, padding: 24 }}>
            <CountdownTimer
              key={round}
              seconds={90}
              running={running}
              onComplete={() => setDone(true)}
              colors={{ text: c.foreground, track: c.muted, fill: c.primary }}
            />
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 12 }}>
              {button(running ? "Pause" : "Resume", () => setRunning(!running))}
              {button("Restart", () => {
                setRound(round + 1);
                setDone(false);
                setRunning(true);
              })}
            </View>
            <Text style={{ textAlign: "center", color: c.mutedForeground }}>
              {done ? "Time is up" : "Counting down"}
            </Text>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default CountdownTimerDemo;
