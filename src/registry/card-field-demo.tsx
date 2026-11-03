"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { CardField, type CardValue } from "./card-field";
import { NativeStage } from "./native-stage";

export function CardFieldDemo() {
  const [card, setCard] = useState<CardValue>({ number: "", expiry: "", cvc: "" });

  return (
    <NativeStage height={320}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 14, padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Payment</Text>
          <CardField
            value={card}
            onChange={setCard}
            colors={{
              surface: c.card,
              border: c.border,
              text: c.foreground,
              placeholder: c.mutedForeground,
              error: c.destructive,
            }}
          />
          <Text style={{ fontSize: 13, color: c.mutedForeground }}>
            Try 4242 4242 4242 4242 for a valid test card.
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default CardFieldDemo;
