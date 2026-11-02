"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { SlideConfirm } from "./slide-confirm";
import { NativeStage } from "./native-stage";

export function SlideConfirmDemo() {
  const [payments, setPayments] = useState(0);

  return (
    <NativeStage height={420}>
      {(c) => {
        const colors = {
          track: c.muted,
          fill: c.primary,
          thumb: c.card,
          icon: c.primary,
          text: c.mutedForeground,
          confirmedText: c.primaryForeground,
        };
        return (
          <View style={{ flex: 1, justifyContent: "space-between", padding: 24 }}>
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  letterSpacing: 1,
                  color: c.mutedForeground,
                }}
              >
                CONFIRM PAYMENT
              </Text>
              <Text style={{ fontSize: 40, fontWeight: "800", color: c.foreground }}>$128.40</Text>
              <Text style={{ fontSize: 15, color: c.mutedForeground }}>
                Northwind Energy, October bill
              </Text>
              <Text
                accessibilityLiveRegion="polite"
                style={{ marginTop: 8, fontSize: 14, color: c.foreground }}
              >
                {payments === 0
                  ? "Not paid yet"
                  : `Paid ${payments} time${payments === 1 ? "" : "s"} in this demo`}
              </Text>
            </View>
            <View style={{ gap: 14 }}>
              <SlideConfirm
                label="Slide to pay"
                confirmedLabel="Paid"
                resetAfter={2600}
                onConfirm={() => setPayments((n) => n + 1)}
                colors={colors}
              />
              <SlideConfirm label="Locked" disabled onConfirm={() => {}} colors={colors} />
            </View>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default SlideConfirmDemo;
