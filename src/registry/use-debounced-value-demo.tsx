"use client";

import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useDebouncedValue } from "./use-debounced-value";
import { NativeStage } from "./native-stage";

export function UseDebouncedValueDemo() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 500);
  const [searches, setSearches] = useState(0);

  useEffect(() => {
    if (debounced) setSearches((n) => n + 1);
  }, [debounced]);

  return (
    <NativeStage height={340}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 14, padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Search</Text>
          <TextInput
            accessibilityLabel="Search"
            value={query}
            onChangeText={setQuery}
            placeholder="Start typing"
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
          <Text style={{ fontSize: 14, color: c.mutedForeground }}>Live value: {query || "-"}</Text>
          <Text accessibilityLiveRegion="polite" style={{ fontSize: 14, color: c.foreground }}>
            Debounced value: {debounced || "-"}
          </Text>
          <Text style={{ fontSize: 14, color: c.mutedForeground }}>Searches run: {searches}</Text>
        </View>
      )}
    </NativeStage>
  );
}

export default UseDebouncedValueDemo;
