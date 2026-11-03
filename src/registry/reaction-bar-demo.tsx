"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { ReactionBar, type Reaction } from "./reaction-bar";
import { NativeStage } from "./native-stage";

const REACTIONS: Reaction[] = [
  { id: "like", emoji: "👍", label: "Like" },
  { id: "love", emoji: "❤️", label: "Love" },
  { id: "laugh", emoji: "😂", label: "Laugh" },
  { id: "wow", emoji: "😮", label: "Wow" },
  { id: "sad", emoji: "😢", label: "Sad" },
];

const NAMES: Record<string, string> = Object.fromEntries(REACTIONS.map((r) => [r.id, r.label]));

export function ReactionBarDemo() {
  const [mine, setMine] = useState<string | null>("love");

  return (
    <NativeStage height={360}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 16, padding: 24 }}>
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: c.card,
              borderWidth: 1,
              borderColor: c.border,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: c.mutedForeground }}>
              Maya Chen, 2 hours ago
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 23, color: c.foreground }}>
              Finally shipped the new onboarding. Three weeks of work, one very tired designer.
            </Text>
          </View>
          <ReactionBar
            reactions={REACTIONS}
            counts={{ like: 12, love: 8, laugh: 3, wow: 0, sad: 0 }}
            value={mine}
            onChange={setMine}
            colors={{
              pill: c.muted,
              selectedPill: c.card,
              selectedBorder: c.primary,
              text: c.foreground,
              count: c.mutedForeground,
            }}
          />
          <Text accessibilityLiveRegion="polite" style={{ fontSize: 13, color: c.mutedForeground }}>
            {mine ? `You reacted with ${NAMES[mine]}` : "No reaction yet"}
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default ReactionBarDemo;
