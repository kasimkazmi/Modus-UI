"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FoldPanel } from "./fold-panel";
import { NativeStage } from "./native-stage";

export function FoldPanelDemo() {
  const [multiple, setMultiple] = useState(false);

  return (
    <NativeStage height={560}>
      {(c) => {
        const body = { fontSize: 14, lineHeight: 21, color: c.mutedForeground };
        return (
          <View style={{ flex: 1, padding: 20, gap: 16 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Help</Text>
            <FoldPanel
              key={String(multiple)}
              multiple={multiple}
              defaultOpen={["shipping"]}
              colors={{
                surface: c.card,
                text: c.foreground,
                mutedText: c.mutedForeground,
                border: c.border,
              }}
              items={[
                {
                  id: "shipping",
                  title: "How long does shipping take?",
                  content: (
                    <Text style={body}>
                      Orders leave the warehouse within a day. Standard delivery takes three to five
                      working days, and express arrives the next morning if you order before noon.
                    </Text>
                  ),
                },
                {
                  id: "returns",
                  title: "Can I return an item?",
                  content: (
                    <View style={{ gap: 8 }}>
                      <Text style={body}>
                        Yes, within 30 days of delivery, as long as it is unused and in its original
                        packaging.
                      </Text>
                      <Text style={body}>
                        Start a return from your order page and we send a prepaid label.
                      </Text>
                    </View>
                  ),
                },
                {
                  id: "sizing",
                  title: "What size should I order?",
                  content: (
                    <Text style={body}>
                      Our sizing runs true. If you are between sizes, go up one for a relaxed fit.
                    </Text>
                  ),
                },
                {
                  id: "contact",
                  title: "How do I reach support?",
                  content: (
                    <Text style={body}>
                      Message us in the app any day from 8am to 8pm. Most replies arrive in under
                      ten minutes.
                    </Text>
                  ),
                },
              ]}
            />
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: multiple }}
              onPress={() => setMultiple((m) => !m)}
              style={{ alignSelf: "flex-start", paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                Several open at once: {multiple ? "on" : "off"} (tap to switch)
              </Text>
            </Pressable>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default FoldPanelDemo;
