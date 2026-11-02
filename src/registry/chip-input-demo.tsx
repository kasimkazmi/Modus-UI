"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChipInput } from "./chip-input";
import { NativeStage } from "./native-stage";

const LIMIT = 6;

export function ChipInputDemo() {
  const [topics, setTopics] = useState(["design", "mobile"]);

  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1, padding: 20, gap: 14 }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>New post</Text>
            <Text style={{ fontSize: 14, color: c.mutedForeground }}>
              Type a topic, then press Enter or a comma.
            </Text>
          </View>
          <ChipInput
            value={topics}
            onChange={setTopics}
            placeholder="Add a topic"
            maxChips={LIMIT}
            validate={(text) => text.length <= 20}
            colors={{
              field: c.card,
              chip: c.muted,
              chipText: c.foreground,
              text: c.foreground,
              placeholder: c.mutedForeground,
              border: c.border,
              focus: c.primary,
            }}
          />
          <View
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>
              {topics.length} of {LIMIT} topics
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear all"
              onPress={() => setTopics([])}
              style={({ pressed }) => ({
                minHeight: 44,
                justifyContent: "center",
                paddingHorizontal: 16,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.primary }}>Clear all</Text>
            </Pressable>
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default ChipInputDemo;
