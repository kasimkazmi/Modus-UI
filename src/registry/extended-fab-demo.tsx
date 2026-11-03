"use client";

import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ExtendedFab } from "./extended-fab";
import { NativeStage } from "./native-stage";

export function ExtendedFabDemo() {
  const [collapsed, setCollapsed] = useState(false);
  const [composed, setComposed] = useState(0);

  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1 }}>
          <ScrollView
            scrollEventThrottle={16}
            onScroll={(event) => setCollapsed(event.nativeEvent.contentOffset.y > 40)}
            contentContainerStyle={{ padding: 16, gap: 10 }}
          >
            {Array.from({ length: 14 }, (_, i) => (
              <View
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 14,
                  backgroundColor: c.card,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Text style={{ fontSize: 15, color: c.foreground }}>Message {i + 1}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={{ position: "absolute", right: 16, bottom: 16 }}>
            <ExtendedFab
              label="Compose"
              icon="✎"
              collapsed={collapsed}
              onPress={() => setComposed(composed + 1)}
              colors={{ background: c.primary, text: c.primaryForeground }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle collapsed"
            onPress={() => setCollapsed(!collapsed)}
            style={{ position: "absolute", left: 16, bottom: 24 }}
          >
            <Text style={{ color: c.mutedForeground, fontSize: 13 }}>
              {composed} drafts · tap to {collapsed ? "expand" : "collapse"}
            </Text>
          </Pressable>
        </View>
      )}
    </NativeStage>
  );
}

export default ExtendedFabDemo;
