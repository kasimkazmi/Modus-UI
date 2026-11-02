"use client";

import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FlickToast, type FlickToastItem } from "./flick-toast";
import { NativeStage } from "./native-stage";

const MESSAGES: Omit<FlickToastItem, "id">[] = [
  { title: "Changes saved", description: "Your draft was synced to the cloud.", tone: "success" },
  {
    title: "Upload failed",
    description: "The file is larger than 10 MB. Try a smaller one.",
    tone: "error",
  },
  { title: "New message from Maya", description: "Can we move the review to 3pm?" },
  { title: "Link copied" },
];

export function FlickToastDemo() {
  const [toasts, setToasts] = useState<FlickToastItem[]>([]);
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const count = useRef(0);

  const show = (message: Omit<FlickToastItem, "id">) => {
    count.current += 1;
    setToasts((all) => [...all, { ...message, id: String(count.current) }]);
  };

  return (
    <NativeStage height={460}>
      {(c) => (
        <View style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: 24,
            }}
          >
            <Text style={{ marginBottom: 6, fontSize: 22, fontWeight: "700", color: c.foreground }}>
              Toasts
            </Text>
            {[
              ["Show success", MESSAGES[0]],
              ["Show error", MESSAGES[1]],
              ["Show message", MESSAGES[2]],
              ["Show short", MESSAGES[3]],
            ].map(([label, message]) => (
              <Pressable
                key={label as string}
                accessibilityRole="button"
                onPress={() => show(message as Omit<FlickToastItem, "id">)}
                style={({ pressed }) => ({
                  minWidth: 180,
                  alignItems: "center",
                  paddingVertical: 11,
                  borderRadius: 999,
                  backgroundColor: c.primary,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: c.primaryForeground }}>
                  {label as string}
                </Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setPosition((p) => (p === "top" ? "bottom" : "top"))}
              style={{ paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                Position: {position} (tap to switch)
              </Text>
            </Pressable>
            <Text style={{ fontSize: 12, color: c.mutedForeground }}>
              Flick a toast sideways or off the edge
            </Text>
          </View>
          <FlickToast
            toasts={toasts}
            position={position}
            onDismiss={(id) => setToasts((all) => all.filter((toast) => toast.id !== id))}
            colors={{
              surface: c.foreground,
              text: c.background,
              mutedText: c.muted,
              accent: c.primaryForeground,
            }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default FlickToastDemo;
