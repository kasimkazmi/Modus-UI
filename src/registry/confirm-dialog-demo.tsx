"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ConfirmDialog } from "./confirm-dialog";
import { NativeStage } from "./native-stage";

type Kind = "delete" | "publish" | null;

export function ConfirmDialogDemo() {
  const [kind, setKind] = useState<Kind>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("Nothing happened yet");

  const close = () => setKind(null);
  const confirm = () => {
    const done = kind === "delete" ? "Project deleted" : "Changes published";
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setKind(null);
      setResult(done);
    }, 1100);
  };

  return (
    <NativeStage height={420}>
      {(c) => {
        const button = (label: string, onPress: () => void, destructive = false) => (
          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => ({
              minHeight: 46,
              paddingHorizontal: 22,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: destructive ? c.destructive : c.primary,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: destructive ? "#ffffff" : c.primaryForeground,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );

        return (
          <View style={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                padding: 24,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>
                Harbor Lofts
              </Text>
              <Text
                accessibilityLiveRegion="polite"
                style={{ fontSize: 14, color: c.mutedForeground }}
              >
                {result}
              </Text>
              {button("Publish changes", () => setKind("publish"))}
              {button("Delete project", () => setKind("delete"), true)}
            </View>
            <ConfirmDialog
              open={kind !== null}
              destructive={kind === "delete"}
              loading={loading}
              title={kind === "delete" ? "Delete this project?" : "Publish your changes?"}
              message={
                kind === "delete"
                  ? "This removes 24 files and cannot be undone."
                  : "Everyone with the link will see the new version."
              }
              confirmLabel={kind === "delete" ? "Delete" : "Publish"}
              onConfirm={confirm}
              onCancel={close}
              colors={{
                surface: c.card,
                title: c.foreground,
                message: c.mutedForeground,
                border: c.border,
                cancelText: c.foreground,
                confirm: c.primary,
                confirmText: kind === "delete" ? "#ffffff" : c.primaryForeground,
                destructive: c.destructive,
              }}
            />
          </View>
        );
      }}
    </NativeStage>
  );
}

export default ConfirmDialogDemo;
