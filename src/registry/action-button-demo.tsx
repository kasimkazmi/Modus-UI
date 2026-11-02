"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { ActionButton } from "./action-button";
import { NativeStage } from "./native-stage";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function ActionButtonDemo() {
  const [log, setLog] = useState("Press a button");

  return (
    <NativeStage height={420}>
      {(c) => {
        const colors = {
          background: c.primary,
          text: c.primaryForeground,
          success: "#16a34a",
          error: c.destructive,
        };
        return (
          <View style={{ flex: 1, justifyContent: "center", gap: 18, paddingHorizontal: 24 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Checkout</Text>
              <Text
                accessibilityLiveRegion="polite"
                style={{ fontSize: 14, color: c.mutedForeground }}
              >
                {log}
              </Text>
            </View>
            <ActionButton
              label="Save changes"
              fullWidth
              size="lg"
              colors={colors}
              onPress={async () => {
                setLog("Saving…");
                await wait(1400);
                setLog("Saved");
              }}
            />
            <ActionButton
              label="Pay $24.00"
              variant="outline"
              fullWidth
              colors={colors}
              errorLabel="Card declined"
              onPress={async () => {
                setLog("Charging card…");
                await wait(1200);
                setLog("The card was declined");
                throw new Error("declined");
              }}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <ActionButton
                label="Not now"
                variant="ghost"
                colors={colors}
                onPress={() => setLog("Skipped")}
              />
              <ActionButton label="Unavailable" disabled colors={colors} onPress={() => {}} />
            </View>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default ActionButtonDemo;
