"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { UndoSnackbar } from "./undo-snackbar";
import { NativeStage } from "./native-stage";

export function UndoSnackbarDemo() {
  const [items, setItems] = useState(["Groceries", "Gym plan", "Trip ideas"]);
  const [removed, setRemoved] = useState<{ name: string; index: number } | null>(null);

  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1, padding: 20, gap: 10, justifyContent: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Notes</Text>
          {items.map((name, index) => (
            <View
              key={name}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 14,
                borderRadius: 14,
                backgroundColor: c.card,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <Text style={{ fontSize: 16, color: c.foreground }}>{name}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${name}`}
                onPress={() => {
                  setRemoved({ name, index });
                  setItems(items.filter((n) => n !== name));
                }}
              >
                <Text style={{ color: c.destructive, fontWeight: "700" }}>Delete</Text>
              </Pressable>
            </View>
          ))}
          <UndoSnackbar
            open={removed !== null}
            message={removed ? `${removed.name} deleted` : ""}
            onAction={() =>
              removed &&
              setItems((now) => [
                ...now.slice(0, removed.index),
                removed.name,
                ...now.slice(removed.index),
              ])
            }
            onClose={() => setRemoved(null)}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default UndoSnackbarDemo;
