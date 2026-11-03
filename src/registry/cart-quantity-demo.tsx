"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CartQuantity } from "./cart-quantity";
import { NativeStage } from "./native-stage";

export function CartQuantityDemo() {
  const [qty, setQty] = useState(2);
  const [inCart, setInCart] = useState(true);

  return (
    <NativeStage height={260}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 16, padding: 24 }}>
          {inCart ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 14,
                borderRadius: 16,
                backgroundColor: c.card,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: c.foreground }}>
                  Linen shirt
                </Text>
                <Text style={{ fontSize: 14, color: c.mutedForeground }}>
                  ${(qty * 39).toFixed(2)}
                </Text>
              </View>
              <CartQuantity
                label="Linen shirt"
                value={qty}
                max={5}
                onChange={setQty}
                onRemove={() => setInCart(false)}
                colors={{
                  surface: c.card,
                  border: c.border,
                  text: c.foreground,
                  accent: c.primary,
                  remove: c.destructive,
                }}
              />
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add it back"
              onPress={() => {
                setQty(1);
                setInCart(true);
              }}
              style={{
                alignSelf: "center",
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 12,
                backgroundColor: c.primary,
              }}
            >
              <Text style={{ fontWeight: "600", color: c.primaryForeground }}>
                Removed. Add it back
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </NativeStage>
  );
}

export default CartQuantityDemo;
