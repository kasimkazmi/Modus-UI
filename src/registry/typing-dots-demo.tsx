"use client";

import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TypingDots } from "./typing-dots";
import { NativeStage, type StageColors } from "./native-stage";

const REPLIES = ["Yes! 12:30 at the usual place?", "I will bring the notes from Monday too."];

function Bubble({ c, mine, children }: { c: StageColors; mine?: boolean; children: string }) {
  return (
    <View
      style={{
        alignSelf: mine ? "flex-end" : "flex-start",
        maxWidth: "80%",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        backgroundColor: mine ? c.primary : c.muted,
      }}
    >
      <Text style={{ fontSize: 15, color: mine ? c.primaryForeground : c.foreground }}>
        {children}
      </Text>
    </View>
  );
}

export function TypingDotsDemo() {
  const [round, setRound] = useState(0);
  const [shown, setShown] = useState(0);

  // Each reply appears after a stretch of typing, then the next one starts typing.
  useEffect(() => {
    if (shown >= REPLIES.length) return;
    const timer = setTimeout(() => setShown((n) => n + 1), 2600);
    return () => clearTimeout(timer);
  }, [shown, round]);

  const typing = shown < REPLIES.length;

  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1, padding: 20, gap: 10 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Maya</Text>
          <Bubble c={c} mine>
            Are we still on for lunch tomorrow?
          </Bubble>
          {REPLIES.slice(0, shown).map((reply) => (
            <Bubble key={reply} c={c}>
              {reply}
            </Bubble>
          ))}
          {typing ? (
            <TypingDots colors={{ dot: c.mutedForeground, bubble: c.muted }} />
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setShown(0);
                setRound((n) => n + 1);
              }}
              style={({ pressed }) => ({
                alignSelf: "center",
                marginTop: 12,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: c.primary,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontWeight: "600", color: c.primaryForeground }}>Replay</Text>
            </Pressable>
          )}
        </View>
      )}
    </NativeStage>
  );
}

export default TypingDotsDemo;
