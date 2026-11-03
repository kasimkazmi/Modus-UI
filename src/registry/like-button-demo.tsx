"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { LikeButton } from "./like-button";
import { NativeStage } from "./native-stage";

export function LikeButtonDemo() {
  const [liked, setLiked] = useState(false);

  return (
    <NativeStage height={280}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
          <View
            style={{
              padding: 16,
              borderRadius: 18,
              gap: 12,
              backgroundColor: c.card,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: c.foreground }}>
              Sunrise over the bay
            </Text>
            <Text style={{ fontSize: 14, color: c.mutedForeground }}>
              Posted by Maya · 2 hours ago
            </Text>
            <LikeButton
              liked={liked}
              onChange={setLiked}
              count={128 + (liked ? 1 : 0)}
              colors={{ idle: c.mutedForeground, count: c.foreground }}
            />
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default LikeButtonDemo;
