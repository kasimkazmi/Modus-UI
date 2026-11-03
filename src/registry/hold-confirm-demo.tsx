"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { HoldConfirm } from "./hold-confirm";
import { NativeStage } from "./native-stage";

export function HoldConfirmDemo() {
  const [deleted, setDeleted] = useState(0);

  return (
    <NativeStage height={300}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 16, padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Danger zone</Text>
          <Text style={{ fontSize: 14, color: c.mutedForeground }}>
            Press and hold to delete this project. Let go early and nothing happens.
          </Text>
          <HoldConfirm
            label="Delete project"
            doneLabel="Deleted"
            duration={1000}
            onComplete={() => setDeleted(deleted + 1)}
            colors={{ background: c.muted, fill: c.destructive, text: c.foreground }}
          />
          <Text accessibilityLiveRegion="polite" style={{ fontSize: 13, color: c.mutedForeground }}>
            Deleted {deleted} time{deleted === 1 ? "" : "s"}
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default HoldConfirmDemo;
