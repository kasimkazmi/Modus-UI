"use client";

import { useState } from "react";
import { View } from "react-native";
import { EmptyState } from "./empty-state";
import { NativeStage } from "./native-stage";

export function EmptyStateDemo() {
  const [added, setAdded] = useState(0);

  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <EmptyState
            icon={added ? "🎉" : "📭"}
            title={added ? `${added} message${added > 1 ? "s" : ""} sent` : "No messages yet"}
            message={
              added
                ? "Nice start. Your inbox will fill up from here."
                : "When someone writes to you, it will show up here."
            }
            actionLabel="Send a message"
            onAction={() => setAdded(added + 1)}
            colors={{
              badge: c.muted,
              title: c.foreground,
              message: c.mutedForeground,
              button: c.primary,
              buttonText: c.primaryForeground,
            }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default EmptyStateDemo;
