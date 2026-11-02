"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { NoticeBanner, type NoticeTone } from "./notice-banner";
import { NativeStage } from "./native-stage";

const NOTICES: { id: string; tone: NoticeTone; title: string; message: string; action?: string }[] =
  [
    {
      id: "info",
      tone: "info",
      title: "New version available",
      message: "Reload to get the latest changes.",
      action: "Reload",
    },
    {
      id: "success",
      tone: "success",
      title: "Payment received",
      message: "Receipt #4821 was sent to your email.",
    },
    {
      id: "warning",
      tone: "warning",
      title: "Storage almost full",
      message: "You have used 9.2 of 10 GB.",
      action: "Manage",
    },
    {
      id: "error",
      tone: "error",
      title: "Sync failed",
      message: "We could not reach the server. Check your connection.",
    },
  ];

export function NoticeBannerDemo() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    info: true,
    success: true,
    warning: true,
    error: true,
  });
  const [last, setLast] = useState("Swipe a banner sideways or press ×");

  return (
    <NativeStage height={520}>
      {(c) => {
        const colors = { surface: c.card, title: c.foreground, message: c.mutedForeground };
        return (
          <View style={{ flex: 1, padding: 20, gap: 10 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>
              Notifications
            </Text>
            {NOTICES.map((notice) => (
              <NoticeBanner
                key={notice.id}
                tone={notice.tone}
                title={notice.title}
                message={notice.message}
                visible={open[notice.id]}
                colors={colors}
                action={
                  notice.action
                    ? { label: notice.action, onPress: () => setLast(`${notice.action} pressed`) }
                    : undefined
                }
                onDismiss={() => {
                  setOpen((all) => ({ ...all, [notice.id]: false }));
                  setLast(`${notice.title} dismissed`);
                }}
              />
            ))}
            <Text
              accessibilityLiveRegion="polite"
              style={{ fontSize: 13, color: c.mutedForeground }}
            >
              {last}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setOpen({ info: true, success: true, warning: true, error: true });
                setLast("All notices restored");
              }}
              style={({ pressed }) => ({
                alignSelf: "flex-start",
                minHeight: 44,
                paddingHorizontal: 20,
                borderRadius: 999,
                justifyContent: "center",
                backgroundColor: c.muted,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>
                Show all again
              </Text>
            </Pressable>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default NoticeBannerDemo;
