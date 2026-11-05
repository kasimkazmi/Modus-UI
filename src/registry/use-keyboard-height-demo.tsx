"use client";

import { Text, TextInput, View } from "react-native";
import { useKeyboardHeight } from "./use-keyboard-height.native";
import { NativeStage } from "./native-stage";

export function UseKeyboardHeightDemo() {
  const height = useKeyboardHeight();

  return (
    <NativeStage height={320}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "flex-end", padding: 20, gap: 12 }}>
          <Text style={{ fontSize: 14, color: c.mutedForeground }}>
            useKeyboardHeight() returned
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            style={{ fontSize: 34, fontWeight: "800", color: c.foreground }}
          >
            {height}
          </Text>
          <Text style={{ fontSize: 13, color: c.mutedForeground }}>
            On a phone this is the keyboard&apos;s height while it is open, so you can lift a bar
            above it. It stays 0 on the web.
          </Text>
          <View style={{ marginBottom: height }}>
            <TextInput
              accessibilityLabel="Message"
              placeholder="Type a message"
              placeholderTextColor={c.mutedForeground}
              style={{
                height: 48,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.border,
                backgroundColor: c.card,
                color: c.foreground,
                fontSize: 16,
              }}
            />
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default UseKeyboardHeightDemo;
