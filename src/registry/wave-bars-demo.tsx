"use client";

import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { WaveBars } from "./wave-bars";
import { NativeStage } from "./native-stage";

export function WaveBarsDemo() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.3);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setProgress((p) => (p >= 1 ? 0 : p + 0.02)), 200);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <NativeStage height={300}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 20, padding: 24 }}>
          <View
            style={{
              padding: 16,
              borderRadius: 18,
              gap: 14,
              backgroundColor: c.card,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: c.foreground }}>Voice note</Text>
            <WaveBars
              playing={playing}
              progress={progress}
              height={48}
              colors={{ bar: c.border, played: c.primary }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={playing ? "Pause" : "Play"}
              onPress={() => setPlaying(!playing)}
              style={{
                alignSelf: "flex-start",
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 12,
                backgroundColor: c.primary,
              }}
            >
              <Text style={{ fontWeight: "600", color: c.primaryForeground }}>
                {playing ? "Pause" : "Play"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default WaveBarsDemo;
