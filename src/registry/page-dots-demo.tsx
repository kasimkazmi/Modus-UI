"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { PageDots } from "./page-dots";
import { NativeStage } from "./native-stage";

const PAGES = ["Welcome", "Discover", "Connect", "Get started", "All set"];

export function PageDotsDemo() {
  const [index, setIndex] = useState(0);

  return (
    <NativeStage height={260}>
      {(c) => (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 24, padding: 24 }}
        >
          <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>
            {PAGES[index]}
          </Text>
          <PageDots
            count={PAGES.length}
            index={index}
            onIndexChange={setIndex}
            dotSize={10}
            colors={{ active: c.primary, inactive: c.border }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default PageDotsDemo;
