"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ShimmerBlock } from "./shimmer-block";
import { NativeStage } from "./native-stage";

export function ShimmerBlockDemo() {
  const [loading, setLoading] = useState(true);

  return (
    <NativeStage height={440}>
      {(c) => (
        <View style={{ flex: 1, padding: 24, gap: 24 }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Profile</Text>
            <Pressable
              accessibilityRole="button"
              aria-label="Toggle loading"
              onPress={() => setLoading((value) => !value)}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: c.primary,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.primaryForeground }}>
                {loading ? "Show loaded" : "Show loading"}
              </Text>
            </Pressable>
          </View>

          <View
            style={{
              gap: 18,
              padding: 20,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.card,
            }}
          >
            {loading ? (
              <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel="Loading profile"
                style={{ gap: 18 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <ShimmerBlock
                    decorative
                    width={52}
                    height={52}
                    radius={26}
                    colors={{ base: c.muted, highlight: c.card }}
                  />
                  <ShimmerBlock
                    decorative
                    lines={2}
                    height={14}
                    style={{ flex: 1 }}
                    colors={{ base: c.muted, highlight: c.card }}
                  />
                </View>
                <ShimmerBlock
                  decorative
                  lines={4}
                  height={12}
                  colors={{ base: c.muted, highlight: c.card }}
                />
              </View>
            ) : (
              <View style={{ gap: 18 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: c.primary,
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: "700", color: c.primaryForeground }}>
                      MC
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: c.foreground }}>
                      Maya Chen
                    </Text>
                    <Text style={{ fontSize: 14, color: c.mutedForeground }}>
                      Product designer, Lisbon
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, lineHeight: 21, color: c.foreground }}>
                  Designs calm, fast interfaces for small teams. Currently rebuilding the checkout
                  flow for a grocery app, with a soft spot for motion that explains rather than
                  decorates.
                </Text>
              </View>
            )}
          </View>

          <Text style={{ fontSize: 13, color: c.mutedForeground }}>
            Every placeholder sweeps at the same pace, so they shimmer in step.
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default ShimmerBlockDemo;
